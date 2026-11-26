<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PublicSiteController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Public Website Route (No Auth Required)
Route::get('/sites/{slug}', [PublicSiteController::class, 'show'])->name('sites.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Project Creation & Intake
    Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');

    // Review & Verification
    Route::get('/projects/{project}/review', [ProjectController::class, 'review'])->name('projects.review');
    Route::post('/projects/{project}/confirm-facts', [ProjectController::class, 'confirmFacts'])->name('projects.confirm-facts');

    // Generation
    Route::get('/projects/{project}/generation', [ProjectController::class, 'generation'])->name('projects.generation');
    Route::post('/projects/{project}/generate-site', [ProjectController::class, 'generateSite'])->name('projects.generate-site');

    // Website Editor
    Route::get('/projects/{project}/editor', [ProjectController::class, 'editor'])->name('projects.editor');
    Route::patch('/projects/{project}/sections', [ProjectController::class, 'updateSections'])->name('projects.update-sections');

    // Publishing
    Route::get('/projects/{project}/publish', [ProjectController::class, 'publish'])->name('projects.publish');
    Route::post('/projects/{project}/publish', [ProjectController::class, 'publishSite'])->name('projects.publish-site');
    Route::post('/projects/{project}/unpublish', [ProjectController::class, 'unpublishSite'])->name('projects.unpublish-site');

    // Actions
    Route::post('/projects/{project}/duplicate', [ProjectController::class, 'duplicate'])->name('projects.duplicate');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
