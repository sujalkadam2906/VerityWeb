<?php

namespace Tests\Feature;

use App\Models\BusinessProject;
use App\Models\User;
use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_gemini_service_returns_null_when_api_key_is_unconfigured(): void
    {
        Config::set('services.gemini.api_key', null);

        $service = new GeminiService();
        $this->assertFalse($service->isConfigured());

        $content = $service->generateContent('System', 'Hello');
        $this->assertNull($content);

        $structured = $service->generateStructuredContent('System', 'Hello');
        $this->assertNull($structured);
    }

    public function test_gemini_service_handles_successful_structured_json(): void
    {
        Config::set('services.gemini.api_key', 'AIzaSyFakeKeyForTesting1234567890');
        Config::set('services.gemini.model', 'gemini-1.5-flash');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'headline' => 'Artisan Roasts Crafted in Seattle',
                                        'subheadline' => 'Specialty beans roasted fresh daily.',
                                        'cta' => 'Order Beans',
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $service = new GeminiService();
        $this->assertTrue($service->isConfigured());

        $result = $service->generateStructuredContent('System instructions', 'User prompt');

        $this->assertIsArray($result);
        $this->assertEquals('Artisan Roasts Crafted in Seattle', $result['headline']);
        $this->assertEquals('Order Beans', $result['cta']);
    }

    public function test_gemini_service_retries_on_rate_limit_and_handles_backoff(): void
    {
        Config::set('services.gemini.api_key', 'AIzaSyFakeKeyForTesting1234567890');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                ->push(['error' => 'Rate limit exceeded'], 429)
                ->push([
                    'candidates' => [
                        [
                            'content' => [
                                'parts' => [
                                    ['text' => '{"headline": "Recovered After Retry"}'],
                                ],
                            ],
                        ],
                    ],
                ], 200),
        ]);

        $service = new GeminiService();
        $result = $service->generateStructuredContent('System', 'Prompt');

        $this->assertIsArray($result);
        $this->assertEquals('Recovered After Retry', $result['headline']);
    }

    public function test_regenerate_section_endpoint_updates_project_data(): void
    {
        Config::set('services.gemini.api_key', 'AIzaSyFakeKeyForTesting1234567890');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'headline' => 'Artisan Craftsmanship Reimagined',
                                        'subheadline' => 'Serving pure excellence in Austin.',
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Austin Roastery',
            'city' => 'Austin',
            'category' => 'Coffee Roastery',
            'slug' => 'austin-roastery',
            'sections_data' => [
                'headline' => 'Old Headline',
                'subheadline' => 'Old Subheadline',
            ],
        ]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/regenerate-section", [
            'section_name' => 'Hero',
            'prompt' => 'Make the headline bolder and refined',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('sections_data.headline', 'Artisan Craftsmanship Reimagined');

        $project->refresh();
        $this->assertEquals('Artisan Craftsmanship Reimagined', $project->sections_data['headline']);
    }
}
