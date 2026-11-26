<?php

namespace Tests\Feature;

use App\Models\BusinessProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_end_to_end_user_journey(): void
    {
        $user = User::factory()->create();

        // 1. Dashboard loads
        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);

        // 2. Intake Create Page loads
        $response = $this->actingAs($user)->get('/projects/create');
        $response->assertStatus(200);

        // 3. Submit Intake Wizard
        $response = $this->actingAs($user)->post('/projects', [
            'name' => 'Verity Artisans',
            'category' => 'Artisan Roastery',
            'city' => 'Seattle, WA',
            'address' => '404 Pike Street, Seattle, WA',
            'phone' => '+1 (555) 234-5678',
            'description' => 'Specialty micro-roaster sourcing organic beans with precision brewing.',
            'links' => [
                'website' => 'https://verityartisans.example.com',
                'google' => 'https://maps.google.com/?cid=123456789',
                'instagram' => 'https://instagram.com/verityartisans',
            ],
        ]);

        $project = BusinessProject::where('name', 'Verity Artisans')->first();
        $this->assertNotNull($project);
        $response->assertRedirect("/projects/{$project->id}/review");

        // 4. Review & Verification screen
        $response = $this->actingAs($user)->get("/projects/{$project->id}/review");
        $response->assertStatus(200);

        // 5. Confirm facts & advance to generation
        $response = $this->actingAs($user)->post("/projects/{$project->id}/confirm-facts");
        $response->assertRedirect("/projects/{$project->id}/generation");

        // 6. Generation screen
        $response = $this->actingAs($user)->get("/projects/{$project->id}/generation");
        $response->assertStatus(200);

        // 7. Trigger site generation
        $response = $this->actingAs($user)->post("/projects/{$project->id}/generate-site");
        $response->assertRedirect("/projects/{$project->id}/editor");

        $project->refresh();
        $this->assertNotEmpty($project->sections_data);
        $this->assertEquals('ready_to_edit', $project->status);

        // 8. Interactive Editor screen
        $response = $this->actingAs($user)->get("/projects/{$project->id}/editor");
        $response->assertStatus(200);

        // 9. Update section data and theme
        $updatedSections = $project->sections_data;
        $updatedSections[0]['headline'] = 'Handcrafted Coffee & Daily Breads';
        $response = $this->actingAs($user)->patch("/projects/{$project->id}/sections", [
            'sections_data' => $updatedSections,
            'theme_settings' => [
                'primary_color' => '#16A34A',
                'font_family' => 'font-sans',
                'spacing' => 'compact',
            ],
        ]);
        $response->assertRedirect();

        $project->refresh();
        $this->assertEquals('Handcrafted Coffee & Daily Breads', $project->sections_data[0]['headline']);
        $this->assertEquals('#16A34A', $project->theme_settings['primary_color']);

        // 10. Publish screen
        $response = $this->actingAs($user)->get("/projects/{$project->id}/publish");
        $response->assertStatus(200);

        // 11. Publish site
        $response = $this->actingAs($user)->post("/projects/{$project->id}/publish", [
            'slug' => 'verity-artisans-seattle',
        ]);
        $response->assertRedirect();

        $project->refresh();
        $this->assertTrue((bool) $project->is_published);
        $this->assertEquals('verity-artisans-seattle', $project->slug);
        $this->assertEquals('published', $project->status);

        // 12. Public view by unauthenticated guest
        $publicResponse = $this->get('/sites/verity-artisans-seattle');
        $publicResponse->assertStatus(200);
        $publicResponse->assertSee('Handcrafted Coffee & Daily Breads');

        // 13. Unpublish site
        $response = $this->actingAs($user)->post("/projects/{$project->id}/unpublish");
        $response->assertRedirect();

        $project->refresh();
        $this->assertFalse((bool) $project->is_published);

        // 14. Public view of unpublished site returns 404
        $publicResponse = $this->get('/sites/verity-artisans-seattle');
        $publicResponse->assertStatus(404);
    }
}
