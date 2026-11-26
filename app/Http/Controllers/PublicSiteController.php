<?php

namespace App\Http\Controllers;

use App\Models\BusinessProject;
use Inertia\Inertia;
use Inertia\Response;

class PublicSiteController extends Controller
{
    public function show(string $slug): Response
    {
        $project = BusinessProject::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return Inertia::render('Sites/Public', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'city' => $project->city,
                'category' => $project->category,
                'address' => $project->address,
                'phone' => $project->phone,
                'description' => $project->description,
                'slug' => $project->slug,
                'theme_settings' => $project->theme_settings,
                'sections_data' => $project->sections_data,
            ],
        ]);
    }
}
