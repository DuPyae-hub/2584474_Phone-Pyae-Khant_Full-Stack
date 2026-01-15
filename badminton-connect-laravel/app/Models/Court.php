<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Court extends Model
{
    use HasUuids;

    protected $fillable = [
        'court_name',
        'address',
        'google_map_url',
        'price_rate',
        'opening_hours',
        'contact',
        'images',
        'rating',
        'created_by_admin',
    ];

    protected $casts = [
        'images' => 'array',
        'rating' => 'decimal:1',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin');
    }

    public function partnerRequests(): HasMany
    {
        return $this->hasMany(PartnerRequest::class);
    }

    public function challenges(): HasMany
    {
        return $this->hasMany(Challenge::class);
    }
}
