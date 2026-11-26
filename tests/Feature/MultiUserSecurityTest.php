<?php

namespace Tests\Feature;

use App\Models\BusinessProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MultiUserSecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1 & 2: New user registration and login using newly created credentials.
     */
    public function test_new_user_can_register_and_login_with_new_credentials(): void
    {
        $registerResponse = $this->post('/register', [
            'name' => 'Alice Walker',
            'email' => 'alice@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $this->assertAuthenticated();
        $registerResponse->assertRedirect(route('dashboard', absolute: false));

        $user = User::where('email', 'alice@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('SecurePass123!', $user->password));

        // Logout
        $this->post('/logout');
        $this->assertGuest();

        // Login using newly created credentials
        $loginResponse = $this->post('/login', [
            'email' => 'alice@example.com',
            'password' => 'SecurePass123!',
        ]);

        $this->assertAuthenticatedAs($user);
        $loginResponse->assertRedirect(route('dashboard', absolute: false));
    }

    /**
     * Test 3: Logout revokes authentication.
     */
    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    /**
     * Test 4: Invalid and duplicate registration.
     */
    public function test_invalid_and_duplicate_registration_is_rejected(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        // Duplicate email
        $responseDuplicate = $this->post('/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);
        $responseDuplicate->assertSessionHasErrors(['email']);
        $this->assertGuest();

        // Mismatched password
        $responseMismatch = $this->post('/register', [
            'name' => 'New User',
            'email' => 'brandnew@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword!',
        ]);
        $responseMismatch->assertSessionHasErrors(['password']);
        $this->assertGuest();

        // Invalid email format
        $responseInvalidEmail = $this->post('/register', [
            'name' => 'New User',
            'email' => 'not-an-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);
        $responseInvalidEmail->assertSessionHasErrors(['email']);
        $this->assertGuest();
    }

    /**
     * Test 5: Authenticated dashboard access and guest redirection.
     */
    public function test_guest_is_redirected_and_authenticated_user_can_view_dashboard(): void
    {
        $guestResponse = $this->get('/dashboard');
        $guestResponse->assertRedirect('/login');

        $user = User::factory()->create();
        $authResponse = $this->actingAs($user)->get('/dashboard');
        $authResponse->assertStatus(200);
    }

    /**
     * Test 6: Creating and retrieving a project scoped to owner.
     */
    public function test_user_can_create_and_retrieve_project_on_dashboard(): void
    {
        $user = User::factory()->create();

        $createResponse = $this->actingAs($user)->post('/projects', [
            'name' => 'Alice Roasters',
            'city' => 'Seattle, WA',
            'category' => 'Coffee Roastery',
            'address' => '100 Pike St',
            'phone' => '(206) 555-0100',
            'description' => 'Locally roasted beans.',
        ]);

        $project = BusinessProject::where('name', 'Alice Roasters')->first();
        $this->assertNotNull($project);
        $this->assertEquals($user->id, $project->user_id);
        $createResponse->assertRedirect("/projects/{$project->id}/review");

        // Dashboard only retrieves owner's projects
        $dashboardResponse = $this->actingAs($user)->get('/dashboard');
        $dashboardResponse->assertStatus(200);
        $dashboardResponse->assertSee('Alice Roasters');
    }

    /**
     * Test 7: User A cannot access User B's project views (403 forbidden).
     */
    public function test_user_cannot_view_another_users_project_pages(): void
    {
        $userA = User::factory()->create(['email' => 'usera@example.com']);
        $userB = User::factory()->create(['email' => 'userb@example.com']);

        $projectB = BusinessProject::create([
            'user_id' => $userB->id,
            'name' => 'User B Bakery',
            'city' => 'Portland, OR',
            'status' => 'needs_review',
            'slug' => 'user-b-bakery',
        ]);

        // User A attempts to view User B's review, generation, editor, and publish screens
        $this->actingAs($userA)->get("/projects/{$projectB->id}/review")->assertStatus(403);
        $this->actingAs($userA)->get("/projects/{$projectB->id}/generation")->assertStatus(403);
        $this->actingAs($userA)->get("/projects/{$projectB->id}/editor")->assertStatus(403);
        $this->actingAs($userA)->get("/projects/{$projectB->id}/publish")->assertStatus(403);
    }

    /**
     * Test 8: User A cannot mutate, update, duplicate, or delete User B's project (403 forbidden).
     */
    public function test_user_cannot_modify_or_delete_another_users_project(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $projectB = BusinessProject::create([
            'user_id' => $userB->id,
            'name' => 'User B Original',
            'city' => 'Portland, OR',
            'status' => 'draft',
            'slug' => 'user-b-original',
        ]);

        // User A attempts to confirm facts on User B's project
        $this->actingAs($userA)->post("/projects/{$projectB->id}/confirm-facts", [
            'operating_hours' => 'Hacked Hours',
        ])->assertStatus(403);

        // User A attempts to generate site on User B's project
        $this->actingAs($userA)->post("/projects/{$projectB->id}/generate-site")->assertStatus(403);

        // User A attempts to update sections on User B's project
        $this->actingAs($userA)->patch("/projects/{$projectB->id}/sections", [
            'sections_data' => ['headline' => 'Defaced Website'],
        ])->assertStatus(403);

        // User A attempts to publish User B's project
        $this->actingAs($userA)->post("/projects/{$projectB->id}/publish", [
            'slug' => 'hacked-slug',
        ])->assertStatus(403);

        // User A attempts to unpublish User B's project
        $this->actingAs($userA)->post("/projects/{$projectB->id}/unpublish")->assertStatus(403);

        // User A attempts to duplicate User B's project
        $this->actingAs($userA)->post("/projects/{$projectB->id}/duplicate")->assertStatus(403);

        // User A attempts to delete User B's project
        $this->actingAs($userA)->delete("/projects/{$projectB->id}")->assertStatus(403);

        // Assert User B's project remains untouched
        $this->assertDatabaseHas('business_projects', [
            'id' => $projectB->id,
            'name' => 'User B Original',
            'user_id' => $userB->id,
        ]);
    }

    /**
     * Test 9 & 10: Published public website works without login; unpublished returns 404.
     */
    public function test_public_website_access_and_unpublished_404(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Public Roastery',
            'city' => 'Denver, CO',
            'slug' => 'public-roastery-denver',
            'is_published' => false,
            'sections_data' => [
                'headline' => 'Artisan Roasts in Denver',
            ],
        ]);

        // Unpublished project returns 404 to guests
        $guestResponse = $this->get('/sites/public-roastery-denver');
        $guestResponse->assertStatus(404);

        // Publish the project
        $project->update(['is_published' => true]);

        // Published project is accessible without authentication
        $publishedResponse = $this->get('/sites/public-roastery-denver');
        $publishedResponse->assertStatus(200);
        $publishedResponse->assertSee('Artisan Roasts in Denver');

        // Unpublish again
        $project->update(['is_published' => false]);
        $this->get('/sites/public-roastery-denver')->assertStatus(404);
    }
}
