<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessFact extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_project_id',
        'business_evidence_id',
        'fact_type',
        'fact_key',
        'fact_value',
        'source_label',
        'status',
        'confidence',
        'conflict_with_id',
        'conflict_explanation',
        'user_confirmed',
    ];

    protected $casts = [
        'confidence' => 'float',
        'user_confirmed' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(BusinessProject::class, 'business_project_id');
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(BusinessEvidence::class, 'business_evidence_id');
    }

    public function conflictingFact(): BelongsTo
    {
        return $this->belongsTo(self::class, 'conflict_with_id');
    }
}
