<?php

namespace App\Http\Controllers;

use App\Models\BusinessProject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $projects = $user->projects()
            ->latest('updated_at')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'city' => $project->city,
                    'category' => $project->category ?? 'Local business',
                    'status' => $project->status,
                    'kind' => $project->kind ?? 'cafe',
                    'updated' => $project->updated_at->diffForHumans(),
                ];
            });

        $metrics = [
            'total' => $projects->count(),
            'published' => $projects->where('status', 'published')->count(),
            'needsReview' => $projects->where('status', 'needs_review')->count(),
        ];

        return Inertia::render('Dashboard', [
            'projects' => $projects,
            'metrics' => $metrics,
        ]);
    }
}
