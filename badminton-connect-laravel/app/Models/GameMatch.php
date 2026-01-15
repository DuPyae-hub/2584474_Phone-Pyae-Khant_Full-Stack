<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameMatch extends Model
{
    use HasUuids;

    protected $table = 'matches';

    protected $fillable = [
        'request_id',
        'player1',
        'player2',
        'mode',
        'score_player1',
        'score_player2',
        'player1_confirmed',
        'player2_confirmed',
        'winner',
        'experience_awarded',
    ];

    protected $casts = [
        'player1_confirmed' => 'boolean',
        'player2_confirmed' => 'boolean',
        'experience_awarded' => 'integer',
        'score_player1' => 'integer',
        'score_player2' => 'integer',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(PartnerRequest::class, 'request_id');
    }

    public function player1User(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player1');
    }

    public function player2User(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player2');
    }

    public function winnerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner');
    }
}

