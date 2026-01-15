<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRequestParticipant extends Model
{
    use HasUuids;

    protected $fillable = [
        'request_id',
        'user_id',
        'status',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(PartnerRequest::class, 'request_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
