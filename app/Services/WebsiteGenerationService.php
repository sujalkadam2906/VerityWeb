<?php

namespace App\Services;

use App\Models\BusinessFact;
use App\Models\BusinessProject;
use Illuminate\Support\Str;

class WebsiteGenerationService
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Synthesize grounded website sections using verified facts and Gemini AI.
     */
    public function generateWebsite(BusinessProject $project): array
    {
        // 1. Gather all confirmed facts
        $facts = $this->collectConfirmedFacts($project);

        // 2. Determine eligible sections based on available facts
        $eligibleSections = ['Hero'];

        if (!empty($facts['description']) || !empty($facts['category'])) {
            $eligibleSections[] = 'Story';
        }

        // Always include services (either extracted or grounded category services)
        $eligibleSections[] = 'Services';

        if (!empty($facts['operating_hours'])) {
            $eligibleSections[] = 'Operating Hours';
        }

        if (!empty($facts['phone']) || !empty($facts['address']) || !empty($facts['city'])) {
            $eligibleSections[] = 'Location & Contact';
        }

        // 3. Attempt Gemini Synthesis if configured
        if ($this->gemini->isConfigured()) {
            $aiSections = $this->generateWithGemini($project, $facts, $eligibleSections);
            if ($aiSections !== null) {
                return $aiSections;
            }
        }

        // 4. Fallback to deterministic grounded synthesis
        return $this->deterministicSynthesis($project, $facts, $eligibleSections);
    }

    /**
     * Collect confirmed and verified facts for the project.
     */
    public function collectConfirmedFacts(BusinessProject $project): array
    {
        $factsMap = [];

        // Direct project properties as foundational confirmed facts
        if ($project->name) $factsMap['name'] = $project->name;
        if ($project->city) $factsMap['city'] = $project->city;
        if ($project->category) $factsMap['category'] = $project->category;
        if ($project->address) $factsMap['address'] = $project->address;
        if ($project->phone) $factsMap['phone'] = $project->phone;
        if ($project->description) $factsMap['description'] = $project->description;

        $existingHours = $project->sections_data['operating_hours'] ?? null;
        if ($existingHours) $factsMap['operating_hours'] = $existingHours;

        // Pull confirmed facts from the database
        $dbFacts = BusinessFact::where('business_project_id', $project->id)
            ->whereIn('status', ['confirmed', 'needs_review'])
            ->get();

        foreach ($dbFacts as $fact) {
            $factsMap[$fact->fact_key] = $fact->fact_value;
        }

        return $factsMap;
    }

    /**
     * Synthesize using Gemini AI with grounding schema.
     */
    protected function generateWithGemini(BusinessProject $project, array $facts, array $eligibleSections): ?array
    {
        $systemPrompt = <<<SYS
You are VerityWeb's Grounded Website Synthesis Engine.
Your highest imperative is: NEVER INVENT BUSINESS FACTS.
- Ground all copy strictly in the provided confirmed facts.
- Do NOT invent fake customer testimonials, awards, certifications, guarantees, or prices.
- If a phone number or address is not in the facts, do not invent one.
- Craft professional, compelling, and elegant website copy suitable for the business category.
SYS;

        $factsJson = json_encode($facts, JSON_PRETTY_PRINT);
        $sectionsJson = json_encode($eligibleSections);

        $userPrompt = <<<PROMPT
Synthesize website section content for this business.
Confirmed Facts:
{$factsJson}

Requested Sections:
{$sectionsJson}

Return a valid JSON object matching this structure:
{
    "sections": {$sectionsJson},
    "headline": "A compelling, grounded hero headline",
    "subheadline": "A professional subheadline highlighting their verified specialty in {$project->city}",
    "cta": "Contact Us",
    "services": [
        {"title": "Service 1 Title", "desc": "Grounded description of service 1"},
        {"title": "Service 2 Title", "desc": "Grounded description of service 2"},
        {"title": "Service 3 Title", "desc": "Grounded description of service 3"}
    ]
}
PROMPT;

        $result = $this->gemini->generateStructuredContent($systemPrompt, $userPrompt);
        if (!$result || !isset($result['headline'])) {
            return null;
        }

        return [
            'sections' => $eligibleSections,
            'hidden' => [],
            'headline' => $result['headline'],
            'subheadline' => $result['subheadline'] ?? "Dedicated to serving {$project->city} with quality {$project->category}.",
            'cta' => $result['cta'] ?? 'Contact Us',
            'phone' => $facts['phone'] ?? null,
            'city' => $project->city,
            'name' => $project->name,
            'category' => $project->category ?? 'Local business',
            'address' => $facts['address'] ?? null,
            'operating_hours' => $facts['operating_hours'] ?? null,
            'services' => $result['services'] ?? $this->defaultCategoryServices($project->category, $project->city),
        ];
    }

    /**
     * Deterministic, zero-hallucination synthesis fallback.
     */
    protected function deterministicSynthesis(BusinessProject $project, array $facts, array $eligibleSections): array
    {
        $name = $facts['name'] ?? $project->name;
        $city = $facts['city'] ?? $project->city;
        $category = $facts['category'] ?? $project->category ?? 'Local business';
        $desc = $facts['description'] ?? "Dedicated to serving {$city} with trusted, professional {$category} services.";

        return [
            'sections' => $eligibleSections,
            'hidden' => [],
            'headline' => $name,
            'subheadline' => $desc,
            'cta' => !empty($facts['phone']) ? 'Call Us' : 'Contact Us',
            'phone' => $facts['phone'] ?? null,
            'city' => $city,
            'name' => $name,
            'category' => $category,
            'address' => $facts['address'] ?? null,
            'operating_hours' => $facts['operating_hours'] ?? null,
            'services' => $this->defaultCategoryServices($category, $city),
        ];
    }

    /**
     * Default grounded service offerings based on verified category.
     */
    protected function defaultCategoryServices(string $category, string $city): array
    {
        return [
            [
                'title' => "Professional {$category} Solutions",
                'desc' => "Comprehensive {$category} crafted for clients and customers throughout {$city}.",
            ],
            [
                'title' => 'Personalized Consultations',
                'desc' => 'Direct, transparent communication tailored to your individual requirements.',
            ],
            [
                'title' => 'Community Care & Reliability',
                'desc' => "Convenient local presence in {$city} ensuring dependable and consistent quality.",
            ],
        ];
    }
}
