<?php

namespace App\Http\Controllers;

use App\Services\DashboardData;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('reports/index', [
            ...app(DashboardData::class)->build(),
        ]);
    }
}
