<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Challenge extends Model
{
    use HasUuids;

    protected $fillable = [
        'challenger_id',
        'challenged_id',
        'status',
        'court_id',
        'proposed_date',
        'proposed_time',
        'message',
        'expires_at',
    ];

    protected $casts = [
        'proposed_date' => 'date',
        'proposed_time' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function challenger(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'challenger_id');
    }

    public function challenged(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'challenged_id');
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
