<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ExperienceRule extends Model
{
    use HasUuids;

    protected $fillable = [
        'mode',
        'win_points',
        'lose_points',
        'friendly_points',
    ];

    protected $casts = [
        'win_points' => 'integer',
        'lose_points' => 'integer',
        'friendly_points' => 'integer',
    ];
}
