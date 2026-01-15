<?php

namespace App\Http\Controllers;

use App\Models\PartnerRequest;
use App\Models\PartnerRequestParticipant;
use App\Models\Court;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PartnerRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PartnerRequest::with(['creator.profile', 'court', 'participants.user.profile']);

        // Filters
        if ($request->has('level') && $request->level !== 'all') {
            $query->whereHas('creator.profile', function ($q) use ($request) {
                $q->where('level', $request->level);
            });
        }

        if ($request->has('mode') && $request->mode !== 'all') {
            $query->where('mode', $request->mode);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('creator.profile', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('court', function ($q) use ($search) {
                    $q->where('court_name', 'like', "%{$search}%");
                });
            });
        }

        $requests = $query->latest()->get();

        return Inertia::render('Partners/Index', [
            'requests' => $requests,
            'filters' => $request->only(['level', 'mode', 'status', 'search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mode' => 'required|in:friendly,tournament',
            'court_id' => 'nullable|exists:courts,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'phone' => 'nullable|string',
            'wanted_level' => 'nullable|in:beginner,intermediate,advanced',
            'players_needed' => 'required|integer|min:1',
        ]);

        $validated['created_by_user'] = Auth::id();
        $validated['status'] = 'open';

        $partnerRequest = PartnerRequest::create($validated);

        return redirect()->route('partners.index')
            ->with('success', 'Partner request created successfully!');
    }

    public function join(PartnerRequest $partnerRequest)
    {
        $user = Auth::user();

        if ($partnerRequest->created_by_user === $user->id) {
            return back()->with('error', 'You cannot join your own request.');
        }

        if ($partnerRequest->status !== 'open') {
            return back()->with('error', 'This request is no longer open.');
        }

        $activeParticipants = $partnerRequest->participants()
            ->where('status', '!=', 'cancelled')
            ->count();

        if ($activeParticipants >= $partnerRequest->players_needed) {
            return back()->with('error', 'This request is already full.');
        }

        PartnerRequestParticipant::updateOrCreate(
            [
                'request_id' => $partnerRequest->id,
                'user_id' => $user->id,
            ],
            ['status' => 'joined']
        );

        $newParticipantCount = $partnerRequest->participants()
            ->where('status', '!=', 'cancelled')
            ->count();

        if ($newParticipantCount >= $partnerRequest->players_needed) {
            $partnerRequest->update(['status' => 'matched']);
        }

        return back()->with('success', 'You have joined this partner request!');
    }

    public function markArrived(PartnerRequest $partnerRequest)
    {
        $user = Auth::user();
        $isCreator = $partnerRequest->created_by_user === $user->id;

        if ($isCreator) {
            $partnerRequest->update(['status' => 'arrived']);
        } else {
            $participant = $partnerRequest->participants()
                ->where('user_id', $user->id)
                ->first();

            if ($participant) {
                $participant->update(['status' => 'arrived']);
            }
        }

        return back()->with('success', 'Marked as arrived!');
    }
}
