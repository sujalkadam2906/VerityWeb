<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessProject extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'city',
        'category',
        'address',
        'phone',
        'description',
        'links',
        'status',
        'kind',
        'slug',
        'is_published',
        'theme_settings',
        'sections_data',
    ];

    protected $casts = [
        'links' => 'array',
        'theme_settings' => 'array',
        'sections_data' => 'array',
        'is_published' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(BusinessEvidence::class, 'business_project_id');
    }

    public function facts(): HasMany
    {
        return $this->hasMany(BusinessFact::class, 'business_project_id');
    }
}
