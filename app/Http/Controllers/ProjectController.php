<?php

namespace App\Http\Controllers;

use App\Models\BusinessProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Projects/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'links' => ['nullable', 'array'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (BusinessProject::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $project = $request->user()->projects()->create([
            'name' => $validated['name'],
            'city' => $validated['city'],
            'category' => $validated['category'] ?? 'Local business',
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'description' => $validated['description'] ?? null,
            'links' => array_values(array_filter($validated['links'] ?? [])),
            'status' => 'needs_review',
            'kind' => 'general',
            'slug' => $slug,
            'theme_settings' => [
                'color' => '#4F46E5',
                'font' => 'Modern',
                'spacing' => 48,
            ],
            'sections_data' => $this->defaultSections(
                $validated['name'],
                $validated['city'],
                $validated['category'] ?? 'Local business',
                $validated['phone'] ?? null,
                $validated['description'] ?? null
            ),
        ]);

        return redirect()->route('projects.review', $project->id);
    }

    public function review(Request $request, BusinessProject $project): Response
    {
        $this->authorizeOwner($request, $project);

        return Inertia::render('Projects/Review', [
            'project' => $project,
        ]);
    }

    public function confirmFacts(Request $request, BusinessProject $project): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        $validated = $request->validate([
            'phone' => ['nullable', 'string', 'max:50'],
            'operating_hours' => ['nullable', 'string', 'max:100'],
            'weekend_hours' => ['nullable', 'string', 'max:100'],
        ]);

        if (!empty($validated['phone'])) {
            $project->phone = $validated['phone'];
        }

        $hours = $validated['operating_hours'] ?? $validated['weekend_hours'] ?? null;
        if ($hours) {
            $sections = $project->sections_data ?? [];
            $sections['operating_hours'] = $hours;
            $project->sections_data = $sections;
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

    public function generateSite(Request $request, BusinessProject $project): RedirectResponse
    {
        $this->authorizeOwner($request, $project);

        // Deterministic generation grounded strictly in verified business facts
        $existingHours = $project->sections_data['operating_hours'] ?? null;
        $project->sections_data = $this->defaultSections(
            $project->name,
            $project->city,
            $project->category ?? 'Local business',
            $project->phone,
            $project->description,
            $existingHours
        );
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

        // Check if slug taken by another project
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

    protected function defaultSections(string $name, string $city, string $category, ?string $phone = null, ?string $description = null, ?string $operatingHours = null): array
    {
        $desc = $description ?: "Dedicated to serving {$city} with trusted, professional {$category} services.";
        $hours = $operatingHours ?: 'Monday – Friday: 9:00 AM – 5:00 PM';

        return [
            'sections' => ['Hero', 'Story', 'Services', 'Operating Hours', 'Location & Contact'],
            'hidden' => [],
            'headline' => $name,
            'subheadline' => $desc,
            'cta' => 'Contact Us',
            'phone' => $phone ?? 'Contact directly via website',
            'city' => $city,
            'name' => $name,
            'category' => $category,
            'operating_hours' => $hours,
            'services' => [
                ['title' => "Professional {$category} Services", 'desc' => "Comprehensive {$category} solutions crafted for clients in {$city}."],
                ['title' => 'Consultations & Inquiries', 'desc' => 'Prompt, transparent advice backed by clear communication.'],
                ['title' => 'Local Care & Commitment', 'desc' => "Convenient local presence in {$city} ensuring dependable quality."],
            ],
        ];
    }
}
