<?php

namespace App\Http\Controllers;

use App\Http\Requests\Milestones\StoreMilestoneRequest;
use App\Http\Requests\Milestones\UpdateMilestoneRequest;
use App\Models\Contract;
use App\Models\Milestone;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MilestoneController extends Controller
{
    public function show(Milestone $milestone): Response
    {
        $this->authorizeContract($milestone->contract);

        $milestone->load('contract');

        return Inertia::render('milestones/show', [
            'contract' => $milestone->contract,
            'milestone' => $milestone,
        ]);
    }

    public function store(StoreMilestoneRequest $request, Contract $contract): RedirectResponse
    {
        $this->authorizeContract($contract);

        $validated = $request->validated();

        $contract->milestones()->create([
            'title' => $validated['title'],
            'percentage' => $validated['percentage'],
            'amount' => $contract->total_value * $validated['percentage'] / 100,
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'pending',
        ]);

        return redirect()->route('contracts.show', $contract->id)
            ->with('flash', ['type' => 'success', 'message' => 'تمت إضافة المرحلة بنجاح']);
    }

    public function update(UpdateMilestoneRequest $request, Milestone $milestone): RedirectResponse
    {
        $this->authorizeContract($milestone->contract);

        $validated = $request->validated();

        if (isset($validated['percentage'])) {
            $validated['amount'] = $milestone->contract->total_value * $validated['percentage'] / 100;
        }

        $milestone->update($validated);

        return redirect()->back()
            ->with('flash', ['type' => 'success', 'message' => 'تم تحديث المرحلة بنجاح']);
    }

    private function authorizeContract(Contract $contract): void
    {
        if ($contract->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
