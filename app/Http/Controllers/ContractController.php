<?php

namespace App\Http\Controllers;

use App\Http\Requests\Contracts\AcceptContractRequest;
use App\Http\Requests\Contracts\StoreContractRequest;
use App\Http\Requests\Contracts\UpdateContractRequest;
use App\Models\Contract;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('contracts/create');
    }

    public function createMilestones(): Response
    {
        return Inertia::render('contracts/create-milestones');
    }

    public function index(): Response
    {
        $contracts = Contract::where('user_id', auth()->id())
            ->withCount('milestones')
            ->latest()
            ->get();

        return Inertia::render('contracts/index', [
            'contracts' => $contracts,
        ]);
    }

    public function show(Contract $contract): Response
    {
        $this->authorizeContract($contract);

        $contract->load('milestones');

        return Inertia::render('contracts/show', [
            'contract' => $contract,
        ]);
    }

    public function store(StoreContractRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $taxRate = $validated['tax_rate'] ?? 0;
        $totalValue = $validated['total_value'];
        $taxAmount = $totalValue * $taxRate / 100;

        $contract = Contract::create([
            'user_id' => auth()->id(),
            'contract_token' => Str::uuid()->toString(),
            'project_name' => $validated['project_name'],
            'description' => $validated['description'] ?? null,
            'client_name' => $validated['client_name'],
            'client_email' => $validated['client_email'],
            'total_value' => $totalValue,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'grand_total' => $totalValue + $taxAmount,
            'currency' => $validated['currency'],
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'terms' => $validated['terms'] ?? null,
            'status' => 'draft',
        ]);

        return redirect()->route('contracts.show', $contract->id)
            ->with('flash', ['type' => 'success', 'message' => 'تم إنشاء العقد بنجاح']);
    }

    public function update(UpdateContractRequest $request, Contract $contract): RedirectResponse
    {
        $this->authorizeContract($contract);

        $validated = $request->validated();

        if (isset($validated['total_value']) || isset($validated['tax_rate'])) {
            $totalValue = $validated['total_value'] ?? $contract->total_value;
            $taxRate = $validated['tax_rate'] ?? $contract->tax_rate;
            $validated['tax_amount'] = $totalValue * $taxRate / 100;
            $validated['grand_total'] = $totalValue + $validated['tax_amount'];
        }

        $contract->update($validated);

        return redirect()->back()
            ->with('flash', ['type' => 'success', 'message' => 'تم تحديث العقد بنجاح']);
    }

    public function review(string $token): Response
    {
        $contract = Contract::where('contract_token', $token)
            ->with(['milestones', 'user'])
            ->firstOrFail();

        return Inertia::render('contracts/review', [
            'contract' => $contract,
        ]);
    }

    public function accept(AcceptContractRequest $request, string $token): RedirectResponse
    {
        $contract = Contract::where('contract_token', $token)->firstOrFail();

        if ($contract->status !== 'draft') {
            return redirect()->route('contracts.review', ['token' => $token]);
        }

        $contract->update([
            'status' => 'active',
            'signed_at' => now(),
            'client_ip' => $request->ip(),
        ]);

        return redirect()->route('contracts.review', ['token' => $token])
            ->with('flash', ['type' => 'success', 'message' => 'تم توقيع العقد بنجاح. احتفظ بهذه الصفحة في المفضلة.']);
    }

    private function authorizeContract(Contract $contract): void
    {
        if ($contract->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
