<?php

namespace Tests\Feature;

use App\Models\BusinessFact;
use App\Models\BusinessProject;
use App\Models\User;
use App\Services\GeminiService;
use App\Services\WebsiteGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebsiteGenerationAndEditorTest extends TestCase
{
    use RefreshDatabase;

    public function test_website_generation_omits_unverified_contact_and_hours(): void
    {
        $gemini = $this->createMock(GeminiService::class);
        $gemini->method('isConfigured')->willReturn(false);

        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Minimalist Studio',
            'city' => 'Denver',
            'category' => 'Design Studio',
            'phone' => null, // No phone provided
            'address' => null,
            'slug' => 'minimalist-studio',
            'sections_data' => null,
        ]);

        $service = new WebsiteGenerationService($gemini);
        $sections = $service->generateWebsite($project);

        $this->assertContains('Hero', $sections['sections']);
        $this->assertContains('Services', $sections['sections']);
        // Operating Hours must NOT be present when hours were never confirmed
        $this->assertNotContains('Operating Hours', $sections['sections']);
        $this->assertNull($sections['phone']);
    }

    public function test_multi_user_isolation_on_new_endpoints(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $projectA = BusinessProject::create([
            'user_id' => $userA->id,
            'name' => 'User A Business',
            'city' => 'Miami',
            'slug' => 'user-a-biz',
        ]);

        $fact = BusinessFact::create([
            'business_project_id' => $projectA->id,
            'fact_type' => 'contact',
            'fact_key' => 'phone',
            'fact_value' => '305-555-0100',
            'source_label' => 'Direct Intake',
            'status' => 'conflicting',
        ]);

        // User B cannot resolve User A's facts
        $response = $this->actingAs($userB)->post("/projects/{$projectA->id}/facts/{$fact->id}/resolve", [
            'action' => 'confirm',
        ]);
        $response->assertStatus(403);

        // User B cannot regenerate User A's section
        $response = $this->actingAs($userB)->postJson("/projects/{$projectA->id}/regenerate-section", [
            'section_name' => 'Hero',
            'prompt' => 'Hacked prompt',
        ]);
        $response->assertStatus(403);

        // User B cannot publish User A's project
        $response = $this->actingAs($userB)->post("/projects/{$projectA->id}/publish", [
            'slug' => 'stolen-slug',
        ]);
        $response->assertStatus(403);
    }

    public function test_published_website_is_accessible_publicly_without_authentication(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Public Artisan Cafe',
            'city' => 'San Francisco',
            'category' => 'Bakery & Cafe',
            'slug' => 'public-artisan-cafe',
            'is_published' => true,
            'status' => 'published',
            'sections_data' => [
                'headline' => 'Welcome to Public Artisan Cafe',
                'subheadline' => 'Fresh pastries baked every morning.',
                'cta' => 'View Menu',
                'services' => [
                    ['title' => 'Espresso & Pour Overs', 'desc' => 'Artisanal single-origin roasts.'],
                ],
            ],
        ]);

        // Public guest access (no actingAs)
        $response = $this->get("/sites/{$project->slug}");
        $response->assertStatus(200);
        $response->assertSee('Public Artisan Cafe');
        $response->assertSee('San Francisco');
    }

    public function test_unpublished_website_returns_404_publicly(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Draft Boutique',
            'city' => 'Boston',
            'slug' => 'draft-boutique',
            'is_published' => false,
            'status' => 'ready_to_edit',
        ]);

        $response = $this->get("/sites/{$project->slug}");
        $response->assertStatus(404);
    }

    public function test_section_updates_persist_and_unpublishing_works(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Rustic Table',
            'city' => 'Austin',
            'slug' => 'rustic-table',
            'is_published' => true,
            'status' => 'published',
            'sections_data' => [
                'sections' => ['Hero', 'Story', 'Services'],
                'headline' => 'Original Headline',
            ],
            'theme_settings' => [
                'color' => '#4F46E5',
                'font' => 'Modern',
                'spacing' => 48,
            ],
        ]);

        // 1. Update sections via PATCH
        $patchRes = $this->actingAs($user)->patch("/projects/{$project->id}/sections", [
            'sections_data' => [
                'sections' => ['Hero', 'Services', 'Story'], // Reordered
                'hidden' => ['Story'], // Hidden
                'headline' => 'New Handcrafted Feast',
                'subheadline' => 'Locally sourced dining in Austin.',
                'cta' => 'Book Table',
            ],
            'theme_settings' => [
                'color' => '#16A34A',
                'font' => 'Classic',
                'spacing' => 64,
            ],
        ]);
        $patchRes->assertSessionHasNoErrors();

        $project->refresh();
        $this->assertEquals('New Handcrafted Feast', $project->sections_data['headline']);
        $this->assertEquals(['Story'], $project->sections_data['hidden']);
        $this->assertEquals('#16A34A', $project->theme_settings['color']);

        // 2. Unpublish website
        $unpublishRes = $this->actingAs($user)->post("/projects/{$project->id}/unpublish");
        $unpublishRes->assertSessionHasNoErrors();

        $project->refresh();
        $this->assertFalse($project->is_published);
        $this->assertEquals('ready_to_edit', $project->status);

        // 3. Confirm public site is now 404
        $publicRes = $this->get("/sites/{$project->slug}");
        $publicRes->assertStatus(404);
    }
}
