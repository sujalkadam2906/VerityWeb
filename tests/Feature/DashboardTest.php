<?php

namespace Tests\Feature;

use App\Models\BusinessProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_view_create_project_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/projects/create');

        $response->assertStatus(200);
    }

    public function test_user_can_create_a_business_project(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/projects', [
            'name' => 'The Rustic Hearth Bakery',
            'city' => 'Portland',
            'category' => 'Bakery & Café',
            'address' => '124 Maple Street',
            'description' => 'Artisan breads and slow roast espresso.',
        ]);

        $project = BusinessProject::where('name', 'The Rustic Hearth Bakery')->first();
        $this->assertNotNull($project);
        $response->assertRedirect("/projects/{$project->id}/review");

        $this->assertDatabaseHas('business_projects', [
            'user_id' => $user->id,
            'name' => 'The Rustic Hearth Bakery',
            'city' => 'Portland',
            'status' => 'needs_review',
        ]);
    }

    public function test_user_can_duplicate_their_project(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Original Café',
            'city' => 'Portland',
            'status' => 'needs_review',
        ]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/duplicate");

        $response->assertRedirect('/dashboard');

        $this->assertDatabaseHas('business_projects', [
            'user_id' => $user->id,
            'name' => 'Original Café (Copy)',
        ]);
    }

    public function test_user_cannot_delete_another_users_project(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $project = BusinessProject::create([
            'user_id' => $userA->id,
            'name' => 'User A Business',
            'city' => 'Portland',
            'status' => 'needs_review',
        ]);

        $response = $this->actingAs($userB)->delete("/projects/{$project->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('business_projects', ['id' => $project->id]);
    }
}
