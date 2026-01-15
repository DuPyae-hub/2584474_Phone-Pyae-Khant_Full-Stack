<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\PartnerRequest;
use App\Models\GameMatch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        $stats = [
            'total_courts' => Court::count(),
            'open_requests' => PartnerRequest::where('status', 'open')->count(),
            'upcoming_matches' => 0,
            'total_matches' => 0,
        ];

        if ($user) {
            $stats['upcoming_matches'] = PartnerRequest::where(function ($query) use ($user) {
                $query->where('created_by_user', $user->id)
                    ->orWhere('matched_user', $user->id);
            })
            ->whereIn('status', ['matched', 'arrived'])
            ->count();

            $stats['total_matches'] = GameMatch::where(function ($query) use ($user) {
                $query->where('player1', $user->id)
                    ->orWhere('player2', $user->id);
            })->count();
        }

        $recentCourts = Court::latest()->take(6)->get();
        $recentRequests = PartnerRequest::with(['creator', 'court'])
            ->where('status', 'open')
            ->latest()
            ->take(6)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentCourts' => $recentCourts,
            'recentRequests' => $recentRequests,
        ]);
    }
}
