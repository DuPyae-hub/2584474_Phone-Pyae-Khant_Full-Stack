<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'created_by_user',
        'mode',
        'court_id',
        'date',
        'time',
        'phone',
        'wanted_level',
        'status',
        'matched_user',
        'players_needed',
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime',
        'players_needed' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user');
    }

    public function matchedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'matched_user');
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(PartnerRequestParticipant::class, 'request_id');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(GameMatch::class, 'request_id');
    }
}
