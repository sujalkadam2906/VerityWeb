<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GeminiService
{
    protected ?string $apiKey;
    protected string $model;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->model = config('services.gemini.model', 'gemini-1.5-flash');
        $this->timeout = (int) config('services.gemini.timeout', 30);
    }

    /**
     * Check if Gemini API is configured with an active key.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && is_string($this->apiKey) && strlen(trim($this->apiKey)) > 10;
    }

    /**
     * Generate content with Gemini using system instructions and optional multimodal attachments.
     */
    public function generateContent(string $systemPrompt, string $userPrompt, array $inlineAttachments = []): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        $parts = [];

        // Attach any base64 image or PDF parts
        foreach ($inlineAttachments as $attachment) {
            if (!empty($attachment['data']) && !empty($attachment['mime_type'])) {
                $parts[] = [
                    'inlineData' => [
                        'mimeType' => $attachment['mime_type'],
                        'data' => $attachment['data'],
                    ],
                ];
            }
        }

        $parts[] = ['text' => $userPrompt];

        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemPrompt],
                ],
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => $parts,
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.2,
                'maxOutputTokens' => 2048,
            ],
        ];

        return $this->executeRequest($payload, false);
    }

    /**
     * Generate structured JSON output with schema guidance.
     */
    public function generateStructuredContent(string $systemPrompt, string $userPrompt, ?array $schema = null, array $inlineAttachments = []): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        $parts = [];
        foreach ($inlineAttachments as $attachment) {
            if (!empty($attachment['data']) && !empty($attachment['mime_type'])) {
                $parts[] = [
                    'inlineData' => [
                        'mimeType' => $attachment['mime_type'],
                        'data' => $attachment['data'],
                    ],
                ];
            }
        }
        $parts[] = ['text' => $userPrompt];

        $systemInstructionText = $systemPrompt . "\nCRITICAL: Respond ONLY with valid, raw JSON. Do not include markdown code fences (```json), commentary, or extra text.";

        $generationConfig = [
            'temperature' => 0.1,
            'maxOutputTokens' => 3072,
            'responseMimeType' => 'application/json',
        ];

        if ($schema !== null) {
            $generationConfig['responseSchema'] = $schema;
        }

        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemInstructionText],
                ],
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => $parts,
                ],
            ],
            'generationConfig' => $generationConfig,
        ];

        $rawResponse = $this->executeRequest($payload, true);
        if (!$rawResponse) {
            return null;
        }

        // Clean any stray code fences if the model emitted them
        $cleanJson = trim($rawResponse);
        if (str_starts_with($cleanJson, '```json')) {
            $cleanJson = substr($cleanJson, 7);
        } elseif (str_starts_with($cleanJson, '```')) {
            $cleanJson = substr($cleanJson, 3);
        }
        if (str_ends_with($cleanJson, '```')) {
            $cleanJson = substr($cleanJson, 0, -3);
        }
        $cleanJson = trim($cleanJson);

        $decoded = json_decode($cleanJson, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('Gemini JSON decode error: ' . json_last_error_msg(), [
                'preview' => Str::limit($cleanJson, 200),
            ]);
            return null;
        }

        return $decoded;
    }

    /**
     * Regenerate content for a specific website section (Hero, Story, Services, etc.).
     */
    public function regenerateSection(string $sectionName, array $currentSectionData, array $confirmedFacts, string $userPrompt): array
    {
        $systemPrompt = <<<SYS
You are VerityWeb's Grounded Website Synthesis Engine.
Your highest imperative is: NEVER INVENT BUSINESS FACTS.
- You must strictly base all statements on the provided confirmed business facts.
- Do NOT fabricate phone numbers, email addresses, street addresses, opening hours, prices, awards, certifications, ratings, or customer reviews.
- If a detail is missing or unknown, leave it omitted. Do not invent placeholders.
- Maintain professional, authentic copy suitable for the business category.
- Output JSON adhering strictly to the requested section format.
SYS;

        $factsContext = json_encode($confirmedFacts, JSON_PRETTY_PRINT);
        $sectionContext = json_encode($currentSectionData, JSON_PRETTY_PRINT);

        $prompt = <<<PROMPT
Section to polish or regenerate: {$sectionName}
User instruction: {$userPrompt}

Confirmed Business Facts:
{$factsContext}

Current Section Data:
{$sectionContext}

Return a JSON object containing the updated fields for this section.
Example keys depending on section:
- For Hero: {"headline": "...", "subheadline": "...", "cta": "..."}
- For Story: {"headline": "...", "subheadline": "..."}
- For Services: {"services": [{"title": "...", "desc": "..."}, ...]}
- For Operating Hours: {"operating_hours": "..."}
PROMPT;

        $result = $this->generateStructuredContent($systemPrompt, $prompt);

        if ($result && is_array($result)) {
            // Apply grounding validation: do not allow model to inject unverified phone numbers or fake reviews
            if (isset($result['phone']) && !isset($confirmedFacts['phone'])) {
                unset($result['phone']);
            }
            return array_merge($currentSectionData, $result);
        }

        // Graceful fallback if Gemini is unconfigured or failed: return deterministic polish
        return $this->fallbackSectionPolish($sectionName, $currentSectionData, $confirmedFacts, $userPrompt);
    }

    /**
     * Fallback section polish when Gemini is unavailable.
     */
    protected function fallbackSectionPolish(string $sectionName, array $currentData, array $facts, string $instruction): array
    {
        $name = $facts['name'] ?? $currentData['name'] ?? 'Our Business';
        $category = $facts['category'] ?? $currentData['category'] ?? 'Services';
        $city = $facts['city'] ?? $currentData['city'] ?? '';

        if ($sectionName === 'Hero') {
            $currentData['headline'] = "{$name} · {$category}";
            if ($city) {
                $currentData['subheadline'] = "Proudly serving {$city} with trusted, professional {$category}.";
            }
        } elseif ($sectionName === 'Story') {
            $desc = $facts['description'] ?? $currentData['subheadline'] ?? '';
            if ($desc) {
                $currentData['subheadline'] = $desc;
            }
        }

        return $currentData;
    }

    /**
     * Execute HTTP request to Gemini API with exponential backoff on transient errors.
     */
    protected function executeRequest(array $payload, bool $isJsonMode): ?string
    {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $maxRetries = 2;
        $attempt = 0;
        $delayMs = 1000;

        while ($attempt <= $maxRetries) {
            $attempt++;
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->timeout($this->timeout)
                ->post($endpoint, $payload);

                $status = $response->status();

                if ($response->successful()) {
                    $json = $response->json();
                    $candidates = $json['candidates'] ?? [];
                    if (!empty($candidates[0]['content']['parts'][0]['text'])) {
                        return $candidates[0]['content']['parts'][0]['text'];
                    }
                    return null;
                }

                // Handle Rate Limits (429) or Service Unavailable (503)
                if (in_array($status, [429, 503]) && $attempt <= $maxRetries) {
                    usleep($delayMs * 1000);
                    $delayMs *= 2;
                    continue;
                }

                Log::warning("Gemini API call failed with status {$status}", [
                    'model' => $this->model,
                    'error' => Str::limit($response->body(), 300),
                ]);
                return null;
            } catch (\Throwable $e) {
                if ($attempt <= $maxRetries) {
                    usleep($delayMs * 1000);
                    $delayMs *= 2;
                    continue;
                }
                Log::warning("Gemini API network exception: " . $e->getMessage(), [
                    'model' => $this->model,
                ]);
                return null;
            }
        }

        return null;
    }
}
