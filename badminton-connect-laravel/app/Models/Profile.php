<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profile extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'profile_photo',
        'membership_status',
        'trial_start_date',
        'monthly_fee_due',
        'experience_points',
        'level',
        'ranking_position',
        'total_matches_played',
        'total_wins',
        'total_losses',
        'penalty_count',
        'account_suspension_until',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'trial_start_date' => 'datetime',
        'monthly_fee_due' => 'datetime',
        'account_suspension_until' => 'datetime',
        'experience_points' => 'integer',
        'ranking_position' => 'integer',
        'total_matches_played' => 'integer',
        'total_wins' => 'integer',
        'total_losses' => 'integer',
        'penalty_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }

    public function createdPartnerRequests(): HasMany
    {
        return $this->hasMany(PartnerRequest::class, 'created_by_user', 'id');
    }

    public function challengesSent(): HasMany
    {
        return $this->hasMany(Challenge::class, 'challenger_id', 'id');
    }

    public function challengesReceived(): HasMany
    {
        return $this->hasMany(Challenge::class, 'challenged_id', 'id');
    }
}
