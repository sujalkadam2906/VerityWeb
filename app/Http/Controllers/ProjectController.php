<?php

namespace App\Http\Controllers;

use App\Models\BusinessFact;
use App\Models\BusinessProject;
use App\Services\DocumentProcessingService;
use App\Services\FactExtractionService;
use App\Services\GeminiService;
use App\Services\SourceResearchService;
use App\Services\WebsiteGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Projects/Create');
    }

    public function store(
        Request $request,
        DocumentProcessingService $docService,
        SourceResearchService $sourceService,
        FactExtractionService $factService,
        WebsiteGenerationService $generationService
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:3000'],
            'links' => ['nullable', 'array'],
            'links.*' => ['nullable', 'string', 'max:1000'],
            'files' => ['nullable', 'array'],
            'files.*' => ['nullable', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug ?: 'site';
        $counter = 1;
        while (BusinessProject::where('slug', $slug)->exists()) {
            $slug = ($baseSlug ?: 'site') . '-' . $counter;
            $counter++;
        }

        $project = DB::transaction(function () use ($request, $validated, $slug, $docService, $sourceService, $factService, $generationService) {
            $links = array_values(array_filter($validated['links'] ?? []));

            $project = $request->user()->projects()->create([
                'name' => $validated['name'],
                'city' => $validated['city'],
                'category' => $validated['category'] ?? 'Local business',
                'address' => $validated['address'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'description' => $validated['description'] ?? null,
                'links' => $links,
                'status' => 'needs_review',
                'kind' => 'general',
                'slug' => $slug,
                'theme_settings' => [
                    'color' => '#4F46E5',
                    'font' => 'Modern',
                    'spacing' => 48,
                ],
                'sections_data' => null,
            ]);

            // 1. Sync intake baseline facts
            $factService->syncIntakeFacts($project);

            // 2. Process uploaded evidence documents (PDFs, Images)
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $uploadedFile) {
                    if ($uploadedFile && $uploadedFile->isValid()) {
                        try {
                            $evidence = $docService->processUpload($project, $uploadedFile);
                            $factService->extractFromEvidence($evidence);
                        } catch (\Throwable $e) {
                            // Non-fatal: Record failed evidence without crashing project creation
                        }
                    }
                }
            }

            // 3. Process online presence links safely with SSRF protection
            foreach ($links as $link) {
                if (!empty($link)) {
                    try {
                        $evidence = $sourceService->researchUrl($project, $link);
                        if ($evidence && $evidence->status === 'processed') {
                            $factService->extractFromEvidence($evidence);
                        }
                    } catch (\Throwable $e) {
                        // Non-fatal: Continue processing other sources
                    }
                }
            }

            // Pre-seed grounded sections
            $project->sections_data = $generationService->generateWebsite($project);
            $project->save();

            return $project;
        });

        return redirect()->route('projects.review', $project->id);
    }

    public function review(Request $request, BusinessProject $project): Response
    {
        $this->authorizeOwner($request, $project);

        $facts = $project->facts()
            ->with(['evidence', 'conflictingFact'])
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'type' => $f->fact_type,
                    'key' => $f->fact_key,
                    'value' => $f->fact_value,
                    'source' => $f->source_label,
                    'status' => $f->status,
                    'confidence' => $f->confidence,
                    'conflict_with_id' => $f->conflict_with_id,
                    'conflict_explanation' => $f->conflict_explanation,
                    'user_confirmed' => $f->user_confirmed,
                ];
            });

        $evidences = $project->evidences()
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'file_name' => $e->file_name,
                    'file_type' => $e->file_type,
                    'source_url' => $e->source_url,
                    'status' => $e->status,
                    'metadata' => $e->metadata,
                    'has_text' => !empty($e->extracted_text),
                ];
            });

        $hasConflicts = $facts->where('status', 'conflicting')->isNotEmpty();

        return Inertia::render('Projects/Review', [
            'project' => $project,
            'facts' => $facts,
            'evidences' => $evidences,
            'hasConflicts' => $hasConflicts,
        ]);
    }

    public function resolveFact(Request $request, BusinessProject $project, BusinessFact $fact, FactExtractionService $factService): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        if ($fact->business_project_id !== $project->id) {
            abort(403);
        }

        $validated = $request->validate([
            'action' => ['required', 'in:confirm,reject'],
            'edited_value' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validated['action'] === 'confirm') {
            $factService->resolveConflict($fact, $validated['edited_value'] ?? null);
        } else {
            $fact->status = 'rejected';
            $fact->save();
        }

        return back()->with('success', 'Fact status updated.');
    }

    public function confirmFacts(Request $request, BusinessProject $project, FactExtractionService $factService): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $validated = $request->validate([
            'phone' => ['nullable', 'string', 'max:50'],
            'operating_hours' => ['nullable', 'string', 'max:150'],
            'weekend_hours' => ['nullable', 'string', 'max:150'],
        ]);

        if (!empty($validated['phone'])) {
            $project->phone = $validated['phone'];
            BusinessFact::updateOrCreate(
                ['business_project_id' => $project->id, 'fact_key' => 'phone'],
                [
                    'fact_type' => 'contact',
                    'fact_value' => $validated['phone'],
                    'source_label' => 'Owner Confirmed Phone',
                    'status' => 'confirmed',
                    'confidence' => 1.0,
                    'user_confirmed' => true,
                ]
            );
        }

        $hours = $validated['operating_hours'] ?? $validated['weekend_hours'] ?? null;
        if ($hours) {
            $sections = $project->sections_data ?? [];
            $sections['operating_hours'] = $hours;
            $project->sections_data = $sections;

            BusinessFact::updateOrCreate(
                ['business_project_id' => $project->id, 'fact_key' => 'operating_hours'],
                [
                    'fact_type' => 'schedule',
                    'fact_value' => $hours,
                    'source_label' => 'Owner Confirmed Schedule',
                    'status' => 'confirmed',
                    'confidence' => 1.0,
                    'user_confirmed' => true,
                ]
            );
        }

        $project->status = 'ready_to_edit';
        $project->save();

        return redirect()->route('projects.generation', $project->id);
    }

    public function generation(Request $request, BusinessProject $project): Response
    {
        $this->authorizeOwner($request, $project);

        return Inertia::render('Projects/Generation', [
            'project' => $project,
        ]);
    }

    public function generateSite(Request $request, BusinessProject $project, WebsiteGenerationService $generationService): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $project->sections_data = $generationService->generateWebsite($project);
        $project->status = 'ready_to_edit';
        $project->save();

        return redirect()->route('projects.editor', $project->id);
    }

    public function editor(Request $request, BusinessProject $project): Response
    {
        $this->authorizeOwner($request, $project);

        return Inertia::render('Projects/Editor', [
            'project' => $project,
        ]);
    }

    public function updateSections(Request $request, BusinessProject $project): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $validated = $request->validate([
            'sections_data' => ['nullable', 'array'],
            'theme_settings' => ['nullable', 'array'],
        ]);

        if (isset($validated['sections_data'])) {
            $project->sections_data = $validated['sections_data'];
        }
        if (isset($validated['theme_settings'])) {
            $project->theme_settings = $validated['theme_settings'];
        }

        $project->save();

        return back()->with('success', 'Changes saved.');
    }

    public function regenerateSection(
        Request $request,
        BusinessProject $project,
        GeminiService $gemini,
        WebsiteGenerationService $generationService
    ): JsonResponse {
        $this->authorizeOwner($request, $project);

        $validated = $request->validate([
            'section_name' => ['required', 'string', 'max:100'],
            'prompt' => ['required', 'string', 'max:500'],
        ]);

        $facts = $generationService->collectConfirmedFacts($project);
        $currentSections = $project->sections_data ?? [];

        $updated = $gemini->regenerateSection(
            $validated['section_name'],
            $currentSections,
            $facts,
            $validated['prompt']
        );

        $project->sections_data = $updated;
        $project->save();

        return response()->json([
            'success' => true,
            'sections_data' => $updated,
            'suggestion' => $updated['headline'] ?? $updated['subheadline'] ?? 'Updated section content.',
        ]);
    }

    public function publish(Request $request, BusinessProject $project): Response
    {
        $this->authorizeOwner($request, $project);

        return Inertia::render('Projects/Publish', [
            'project' => $project,
        ]);
    }

    public function publishSite(Request $request, BusinessProject $project): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:150', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
        ]);

        $exists = BusinessProject::where('slug', $validated['slug'])
            ->where('id', '!=', $project->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['slug' => 'This website address is already taken. Please choose another.']);
        }

        $project->slug = $validated['slug'];
        $project->is_published = true;
        $project->status = 'published';
        $project->save();

        return redirect()->route('projects.publish', $project->id)->with('success', 'Website published successfully!');
    }

    public function unpublishSite(Request $request, BusinessProject $project): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $project->is_published = false;
        $project->status = 'ready_to_edit';
        $project->save();

        return back()->with('success', 'Website unpublished.');
    }

    public function duplicate(Request $request, BusinessProject $project): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $clone = $project->replicate();
        $clone->name = $project->name . ' (Copy)';
        $clone->status = 'draft';
        $clone->slug = Str::slug($clone->name) . '-' . Str::random(4);
        $clone->is_published = false;
        $clone->save();

        return redirect()->route('dashboard')->with('success', 'Project duplicated.');
    }

    public function destroy(Request $request, BusinessProject $project): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $project->delete();

        return redirect()->route('dashboard')->with('success', 'Project deleted.');
    }

    protected function authorizeOwner(Request $request, BusinessProject $project): void
    {
        if ($project->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access to project.');
        }
    }
}
