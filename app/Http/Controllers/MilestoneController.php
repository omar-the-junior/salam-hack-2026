<?php

namespace App\Http\Controllers;

use App\Http\Requests\Milestones\StoreBulkMilestonesRequest;
use App\Http\Requests\Milestones\StoreMilestoneRequest;
use App\Http\Requests\Milestones\UpdateMilestoneRequest;
use App\Models\Contract;
use App\Models\Milestone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class MilestoneController extends Controller
{
    public function show(Milestone $milestone): Response
    {
        try {
            $this->authorizeContract($milestone->contract);

            $milestone->load('contract');

            $paymentLinks = $milestone->paymentLinks()
                ->where('user_id', auth()->id())
                ->latest()
                ->get();

            return Inertia::render('milestones/show', [
                'contract' => $milestone->contract,
                'milestone' => $milestone,
                'paymentLinks' => $paymentLinks,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@show', [
                'user_id' => auth()->id(),
                'milestone_id' => $milestone->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function store(StoreMilestoneRequest $request, Contract $contract): RedirectResponse
    {
        try {
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
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'user_id' => auth()->id(),
                'contract_id' => $contract->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function storeBulk(StoreBulkMilestonesRequest $request, Contract $contract): RedirectResponse
    {
        try {
            $this->authorizeContract($contract);

            $validated = $request->validated();

            foreach ($validated['milestones'] as $milestoneData) {
                $contract->milestones()->create([
                    'title' => $milestoneData['title'],
                    'percentage' => $milestoneData['percentage'],
                    'amount' => $contract->total_value * $milestoneData['percentage'] / 100,
                    'due_date' => $milestoneData['due_date'] ?? null,
                    'status' => 'pending',
                ]);
            }

            return redirect()->route('contracts.show', $contract->id)
                ->with('flash', ['type' => 'success', 'message' => 'تم إنشاء العقد ومراحله بنجاح']);
        } catch (Throwable $e) {
            Log::error(static::class.'@storeBulk', [
                'user_id' => auth()->id(),
                'contract_id' => $contract->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function update(UpdateMilestoneRequest $request, Milestone $milestone): RedirectResponse
    {
        try {
            $this->authorizeContract($milestone->contract);

            $validated = $request->validated();

            if (isset($validated['percentage'])) {
                $validated['amount'] = $milestone->contract->total_value * $validated['percentage'] / 100;
            }

            $milestone->update($validated);

            return redirect()->back()
                ->with('flash', ['type' => 'success', 'message' => 'تم تحديث المرحلة بنجاح']);
        } catch (Throwable $e) {
            Log::error(static::class.'@update', [
                'user_id' => auth()->id(),
                'milestone_id' => $milestone->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function authorizeContract(Contract $contract): void
    {
        if ($contract->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
