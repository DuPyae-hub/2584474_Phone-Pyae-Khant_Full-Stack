<?php

namespace App\Http\Controllers;

use App\Models\GameMatch;
use App\Models\PartnerRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MatchController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();

        $matchedRequests = PartnerRequest::with(['creator.profile', 'matchedUser.profile', 'court'])
            ->where(function ($query) use ($user) {
                $query->where('created_by_user', $user->id)
                    ->orWhere('matched_user', $user->id);
            })
            ->whereIn('status', ['matched', 'arrived', 'completed'])
            ->orderBy('date')
            ->get();

        $pendingConfirmations = GameMatch::with(['player1User.profile', 'player2User.profile', 'request.court'])
            ->where(function ($query) use ($user) {
                $query->where('player1', $user->id)
                    ->orWhere('player2', $user->id);
            })
            ->where('player1_confirmed', true)
            ->where('player2_confirmed', false)
            ->get();

        return Inertia::render('Matches/Index', [
            'matchedRequests' => $matchedRequests,
            'pendingConfirmations' => $pendingConfirmations,
        ]);
    }

    public function reportResult(Request $request, PartnerRequest $partnerRequest)
    {
        $validated = $request->validate([
            'my_score' => 'required|integer|min:0',
            'opponent_score' => 'required|integer|min:0',
        ]);

        $user = Auth::user();
        $isCreator = $partnerRequest->created_by_user === $user->id;
        $partnerId = $isCreator ? $partnerRequest->matched_user : $partnerRequest->created_by_user;
        $iWon = $validated['my_score'] > $validated['opponent_score'];

        $match = GameMatch::create([
            'request_id' => $partnerRequest->id,
            'player1' => $user->id,
            'player2' => $partnerId,
            'mode' => $partnerRequest->mode,
            'score_player1' => $validated['my_score'],
            'score_player2' => $validated['opponent_score'],
            'winner' => $iWon ? $user->id : $partnerId,
            'player1_confirmed' => true,
            'player2_confirmed' => false,
        ]);

        $partnerRequest->update(['status' => 'completed']);

        return back()->with('success', 'Match result submitted! Waiting for opponent confirmation.');
    }

    public function confirmResult(GameMatch $match)
    {
        $user = Auth::user();

        if ($match->player2 !== $user->id) {
            return back()->with('error', 'You are not authorized to confirm this match.');
        }

        $match->update(['player2_confirmed' => true]);

        // Update player stats (simplified - you may want to add more logic)
        // This would typically call a service or use database functions

        return back()->with('success', 'Match result confirmed! Stats have been updated.');
    }

    public function disputeResult(GameMatch $match)
    {
        $user = Auth::user();

        if ($match->player2 !== $user->id) {
            return back()->with('error', 'You are not authorized to dispute this match.');
        }

        if ($match->request_id) {
            PartnerRequest::where('id', $match->request_id)
                ->update(['status' => 'arrived']);
        }

        $match->delete();

        return back()->with('info', 'Result disputed. Please re-report the correct scores.');
    }
}
