<?php

namespace App\Http\Controllers;

use App\Models\Court;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourtController extends Controller
{
    public function index(): Response
    {
        $courts = Court::orderBy('court_name')->get();
        
        return Inertia::render('Courts/Index', [
            'courts' => $courts,
        ]);
    }

    public function show(Court $court): Response
    {
        $court->load('partnerRequests');
        
        return Inertia::render('Courts/Show', [
            'court' => $court,
        ]);
    }
}
