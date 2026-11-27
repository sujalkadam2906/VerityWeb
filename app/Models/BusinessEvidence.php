<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessEvidence extends Model
{
    use HasFactory;

    protected $table = 'business_evidences';

    protected $fillable = [
        'business_project_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'mime_type',
        'source_url',
        'extracted_text',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'file_size' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(BusinessProject::class, 'business_project_id');
    }

    public function facts(): HasMany
    {
        return $this->hasMany(BusinessFact::class, 'business_evidence_id');
    }
}
