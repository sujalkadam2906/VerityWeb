<?php

namespace App\Services;

use App\Models\BusinessEvidence;
use App\Models\BusinessFact;
use App\Models\BusinessProject;
use Illuminate\Support\Str;

class FactExtractionService
{
    /**
     * Ingest base facts from the user's direct intake submission.
     */
    public function syncIntakeFacts(BusinessProject $project): void
    {
        // 1. Business Name
        BusinessFact::updateOrCreate(
            ['business_project_id' => $project->id, 'fact_key' => 'name', 'source_label' => 'Direct Owner Intake'],
            [
                'fact_type' => 'identity',
                'fact_value' => $project->name,
                'status' => 'confirmed',
                'confidence' => 1.0,
                'user_confirmed' => true,
            ]
        );

        // 2. City
        BusinessFact::updateOrCreate(
            ['business_project_id' => $project->id, 'fact_key' => 'city', 'source_label' => 'Direct Owner Intake'],
            [
                'fact_type' => 'location',
                'fact_value' => $project->city,
                'status' => 'confirmed',
                'confidence' => 1.0,
                'user_confirmed' => true,
            ]
        );

        // 3. Category
        if ($project->category) {
            BusinessFact::updateOrCreate(
                ['business_project_id' => $project->id, 'fact_key' => 'category', 'source_label' => 'Direct Owner Intake'],
                [
                    'fact_type' => 'identity',
                    'fact_value' => $project->category,
                    'status' => 'confirmed',
                    'confidence' => 1.0,
                    'user_confirmed' => true,
                ]
            );
        }

        // 4. Street Address
        if ($project->address) {
            BusinessFact::updateOrCreate(
                ['business_project_id' => $project->id, 'fact_key' => 'address', 'source_label' => 'Direct Owner Intake'],
                [
                    'fact_type' => 'location',
                    'fact_value' => $project->address,
                    'status' => 'confirmed',
                    'confidence' => 1.0,
                    'user_confirmed' => true,
                ]
            );
        }

        // 5. Phone
        if ($project->phone) {
            BusinessFact::updateOrCreate(
                ['business_project_id' => $project->id, 'fact_key' => 'phone', 'source_label' => 'Direct Owner Intake'],
                [
                    'fact_type' => 'contact',
                    'fact_value' => $project->phone,
                    'status' => 'confirmed',
                    'confidence' => 1.0,
                    'user_confirmed' => true,
                ]
            );
        }

        // 6. Description / Overview
        if ($project->description) {
            BusinessFact::updateOrCreate(
                ['business_project_id' => $project->id, 'fact_key' => 'description', 'source_label' => 'Direct Owner Intake'],
                [
                    'fact_type' => 'description',
                    'fact_value' => $project->description,
                    'status' => 'confirmed',
                    'confidence' => 1.0,
                    'user_confirmed' => true,
                ]
            );
        }

        // 7. Operating Hours (if already present in sections_data)
        $existingHours = $project->sections_data['operating_hours'] ?? null;
        if ($existingHours) {
            BusinessFact::updateOrCreate(
                ['business_project_id' => $project->id, 'fact_key' => 'operating_hours', 'source_label' => 'Owner Confirmed Schedule'],
                [
                    'fact_type' => 'schedule',
                    'fact_value' => $existingHours,
                    'status' => 'confirmed',
                    'confidence' => 1.0,
                    'user_confirmed' => true,
                ]
            );
        }
    }

    /**
     * Extract facts from processed evidence and identify potential conflicts.
     */
    public function extractFromEvidence(BusinessEvidence $evidence): void
    {
        $project = $evidence->project;
        $sourceLabel = $evidence->file_type === 'url' ? ($evidence->source_url ?: $evidence->file_name) : "Document: {$evidence->file_name}";
        $text = $evidence->extracted_text ?: '';
        $meta = $evidence->metadata ?: [];

        // Check for phone numbers
        $phones = $meta['found_phones'] ?? [];
        if (empty($phones) && !empty($text)) {
            preg_match_all('/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', $text, $pMatches);
            $phones = array_values(array_unique(array_filter($pMatches[0] ?? [])));
        }

        foreach ($phones as $phone) {
            $existingPhoneFact = BusinessFact::where('business_project_id', $project->id)
                ->where('fact_key', 'phone')
                ->where('status', 'confirmed')
                ->first();

            if ($existingPhoneFact) {
                // If the phone numbers normalize to different digits, flag a conflict
                $normExisting = preg_replace('/\D/', '', $existingPhoneFact->fact_value);
                $normNew = preg_replace('/\D/', '', $phone);

                if ($normExisting !== $normNew && strlen($normNew) >= 7) {
                    $newFact = BusinessFact::create([
                        'business_project_id' => $project->id,
                        'business_evidence_id' => $evidence->id,
                        'fact_type' => 'contact',
                        'fact_key' => 'phone',
                        'fact_value' => $phone,
                        'source_label' => $sourceLabel,
                        'status' => 'conflicting',
                        'confidence' => 0.85,
                        'conflict_with_id' => $existingPhoneFact->id,
                        'conflict_explanation' => "Owner intake lists [{$existingPhoneFact->fact_value}], but {$sourceLabel} states [{$phone}].",
                        'user_confirmed' => false,
                    ]);

                    // Update existing to show conflict status
                    $existingPhoneFact->update([
                        'status' => 'conflicting',
                        'conflict_with_id' => $newFact->id,
                        'conflict_explanation' => "{$sourceLabel} lists an alternate number [{$phone}].",
                    ]);
                    continue;
                }
            } else {
                BusinessFact::create([
                    'business_project_id' => $project->id,
                    'business_evidence_id' => $evidence->id,
                    'fact_type' => 'contact',
                    'fact_key' => 'phone',
                    'fact_value' => $phone,
                    'source_label' => $sourceLabel,
                    'status' => 'needs_review',
                    'confidence' => 0.85,
                    'user_confirmed' => false,
                ]);
            }
        }

        // Check for operating hours patterns (e.g. "Mon-Fri: 9am - 5pm")
        if (!empty($text)) {
            $hoursPattern = '/(?:Monday|Mon|Tue|Wednesday|Wed|Thu|Thursday|Friday|Fri|Saturday|Sat|Sunday|Sun)[\s\w–-]+:\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\s*[–-]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)/i';
            if (preg_match($hoursPattern, $text, $hoursMatch)) {
                $foundHours = trim($hoursMatch[0]);

                $existingHoursFact = BusinessFact::where('business_project_id', $project->id)
                    ->where('fact_key', 'operating_hours')
                    ->first();

                if (!$existingHoursFact) {
                    BusinessFact::create([
                        'business_project_id' => $project->id,
                        'business_evidence_id' => $evidence->id,
                        'fact_type' => 'schedule',
                        'fact_key' => 'operating_hours',
                        'fact_value' => $foundHours,
                        'source_label' => $sourceLabel,
                        'status' => 'needs_review',
                        'confidence' => 0.9,
                        'user_confirmed' => false,
                    ]);
                }
            }
        }
    }

    /**
     * Resolve a conflict by confirming one fact and rejecting the alternative.
     */
    public function resolveConflict(BusinessFact $chosenFact, ?string $editedValue = null): void
    {
        if ($editedValue !== null && trim($editedValue) !== '') {
            $chosenFact->fact_value = trim($editedValue);
        }

        $chosenFact->status = 'confirmed';
        $chosenFact->user_confirmed = true;
        $chosenFact->conflict_explanation = null;

        if ($chosenFact->conflict_with_id) {
            $otherFact = BusinessFact::find($chosenFact->conflict_with_id);
            if ($otherFact) {
                $otherFact->status = 'rejected';
                $otherFact->conflict_explanation = 'Rejected in favor of ' . $chosenFact->source_label;
                $otherFact->save();
            }
        }

        $chosenFact->conflict_with_id = null;
        $chosenFact->save();

        // Update main project column if applicable (e.g. phone or operating_hours)
        $project = $chosenFact->project;
        if ($chosenFact->fact_key === 'phone') {
            $project->phone = $chosenFact->fact_value;
            $project->save();
        } elseif ($chosenFact->fact_key === 'operating_hours') {
            $sections = $project->sections_data ?? [];
            $sections['operating_hours'] = $chosenFact->fact_value;
            $project->sections_data = $sections;
            $project->save();
        }
    }
}
