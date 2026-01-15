<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CourtController;
use App\Http\Controllers\PartnerRequestController;
use App\Http\Controllers\MatchController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/courts', [CourtController::class, 'index'])->name('courts.index');
    Route::get('/courts/{court}', [CourtController::class, 'show'])->name('courts.show');
    
    Route::get('/partners', [PartnerRequestController::class, 'index'])->name('partners.index');
    Route::post('/partner-requests', [PartnerRequestController::class, 'store'])->name('partner-requests.store');
    Route::post('/partner-requests/{partnerRequest}/join', [PartnerRequestController::class, 'join'])->name('partner-requests.join');
    Route::post('/partner-requests/{partnerRequest}/arrived', [PartnerRequestController::class, 'markArrived'])->name('partner-requests.arrived');
    
    Route::get('/matches', [MatchController::class, 'index'])->name('matches.index');
    Route::post('/matches/{partnerRequest}/report', [MatchController::class, 'reportResult'])->name('matches.report');
    Route::post('/matches/{match}/confirm', [MatchController::class, 'confirmResult'])->name('matches.confirm');
    Route::post('/matches/{match}/dispute', [MatchController::class, 'disputeResult'])->name('matches.dispute');
});

// Auth routes can be added here if using Laravel Breeze or similar
