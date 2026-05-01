<?php

namespace App\Http\Controllers;

use App\Http\Requests\Contracts\AcceptContractRequest;
use App\Http\Requests\Contracts\StoreContractRequest;
use App\Http\Requests\Contracts\UpdateContractRequest;
use App\Models\Contract;
use App\Models\Customer;
use App\Notifications\ContractSignatureCodeNotification;
use App\Notifications\ContractSignedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ContractController extends Controller
{
    public function create(Request $request): Response
    {
        try {
            $user = $request->user();
            $newCustomerId = session('new_customer_id');

            $customers = Customer::query()
                ->where('user_id', auth()->id())
                ->latest()
                ->get(['id', 'name', 'email', 'phone']);

            return Inertia::render('contracts/create', [
                'mode' => 'create',
                'contract' => null,
                'initialCustomerId' => '',
                'defaults' => [
                    'tax_rate' => (float) ($user?->default_tax_rate ?? 0),
                ],
                'customers' => $customers,
                'newCustomerId' => $newCustomerId,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@create', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function edit(Request $request, Contract $contract): Response
    {
        try {
            $this->authorizeContract($contract);

            $user = $request->user();
            $newCustomerId = session('new_customer_id');

            $customers = Customer::query()
                ->where('user_id', auth()->id())
                ->latest()
                ->get(['id', 'name', 'email', 'phone']);

            $matchingCustomer = $customers->firstWhere('email', $contract->client_email);

            return Inertia::render('contracts/create', [
                'mode' => 'edit',
                'contract' => [
                    'id' => $contract->id,
                    'project_name' => $contract->project_name,
                    'description' => $contract->description ?? '',
                    'client_name' => $contract->client_name,
                    'client_email' => $contract->client_email,
                    'total_value' => (string) $contract->total_value,
                    'tax_rate' => (string) $contract->tax_rate,
                    'currency' => $contract->currency,
                    'start_date' => $contract->start_date?->format('Y-m-d') ?? '',
                    'end_date' => $contract->end_date?->format('Y-m-d') ?? '',
                    'milestones_count' => $contract->milestones()->count(),
                ],
                'initialCustomerId' => $matchingCustomer?->id ?? '',
                'defaults' => [
                    'tax_rate' => (float) ($user?->default_tax_rate ?? 0),
                ],
                'customers' => $customers,
                'newCustomerId' => $newCustomerId,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@edit', [
                'user_id' => auth()->id(),
                'contract_id' => $contract->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function createMilestones(): Response
    {
        try {
            $contractId = request()->query('contract_id');
            $contract = null;

            if ($contractId) {
                $contract = Contract::where('id', $contractId)
                    ->where('user_id', auth()->id())
                    ->first();
            }

            return Inertia::render('contracts/create-milestones', [
                'contract' => $contract,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@createMilestones', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function createSummary(): RedirectResponse|Response
    {
        try {
            $contractId = request()->query('contract_id');
            $contract = null;

            if ($contractId) {
                $contract = Contract::where('id', $contractId)
                    ->where('user_id', auth()->id())
                    ->first();

                if ($contract) {
                    $this->authorizeContract($contract);

                    if ($contract->status !== 'draft') {
                        return redirect()->route('contracts.show', $contract);
                    }

                    $contract->load('milestones');
                }
            }

            return Inertia::render('contracts/create-summary', [
                'contract' => $contract,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@createSummary', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function index(): Response
    {
        try {
            $contracts = Contract::where('user_id', auth()->id())
                ->withCount('milestones')
                ->latest()
                ->get();

            return Inertia::render('contracts/index', [
                'contracts' => $contracts,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@index', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function show(Contract $contract): Response
    {
        try {
            $this->authorizeContract($contract);

            $contract->load('milestones');

            return Inertia::render('contracts/show', [
                'contract' => $contract,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@show', [
                'user_id' => auth()->id(),
                'contract_id' => $contract->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function store(StoreContractRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $taxRate = $validated['tax_rate'] ?? 0;
            $totalValue = $validated['total_value'];
            $taxAmount = $totalValue * $taxRate / 100;
            $plainCode = (string) random_int(100000, 999999);

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
                'signature_code_hash' => Hash::make($plainCode),
            ]);

            Notification::route('mail', $validated['client_email'])
                ->notify(new ContractSignatureCodeNotification($contract, $plainCode));

            $contract->update(['signature_code_sent_at' => now()]);

            return redirect()->route('contracts.create.milestones', ['contract_id' => $contract->id]);
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function update(UpdateContractRequest $request, Contract $contract): RedirectResponse
    {
        try {
            $this->authorizeContract($contract);

            $validated = $request->validated();

            if (isset($validated['total_value']) || isset($validated['tax_rate'])) {
                $totalValue = $validated['total_value'] ?? $contract->total_value;
                $taxRate = $validated['tax_rate'] ?? $contract->tax_rate;
                $validated['tax_amount'] = $totalValue * $taxRate / 100;
                $validated['grand_total'] = $totalValue + $validated['tax_amount'];
            }

            $continueWizard = $request->boolean('continue_wizard');

            unset($validated['continue_wizard']);

            $contract->update($validated);

            if ($continueWizard) {
                return redirect()->route('contracts.create.milestones', ['contract_id' => $contract->id])
                    ->with('flash', ['type' => 'success', 'message' => 'تم تحديث بيانات العقد']);
            }

            return redirect()->back()
                ->with('flash', ['type' => 'success', 'message' => 'تم تحديث العقد بنجاح']);
        } catch (Throwable $e) {
            Log::error(static::class.'@update', [
                'user_id' => auth()->id(),
                'contract_id' => $contract->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function review(string $token): Response
    {
        try {
            $contract = Contract::where('contract_token', $token)
                ->with(['milestones', 'user'])
                ->firstOrFail();

            return Inertia::render('contracts/review', [
                'contract' => $contract,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@review', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function accept(AcceptContractRequest $request, string $token): RedirectResponse
    {
        try {
            $contract = Contract::where('contract_token', $token)->firstOrFail();

            if ($contract->status !== 'draft') {
                return redirect()->route('contracts.review', ['token' => $token]);
            }

            if (! Hash::check($request->validated()['signature_code'], $contract->signature_code_hash ?? '')) {
                return redirect()->back()->withErrors(['signature_code' => 'رمز التوقيع غير صحيح.'])->withInput();
            }

            $contract->update([
                'status' => 'active',
                'signed_at' => now(),
                'client_ip' => $request->ip(),
            ]);

            try {
                Log::info('Sending ContractSignedNotification', [
                    'contract_id' => $contract->id,
                    'notification_target_user_id' => $contract->user_id,
                ]);
                $contract->user->notify(new ContractSignedNotification($contract));
            } catch (Throwable $notifyException) {
                Log::error(static::class.'@accept: notification failed', [
                    'contract_id' => $contract->id,
                    'notification_target_user_id' => $contract->user_id,
                    'exception' => $notifyException::class,
                    'message' => $notifyException->getMessage(),
                ]);
                throw $notifyException;
            }

            return redirect()->route('contracts.review', ['token' => $token])
                ->with('flash', ['type' => 'success', 'message' => 'تم توقيع العقد بنجاح. احتفظ بهذه الصفحة في المفضلة.']);
        } catch (Throwable $e) {
            Log::error(static::class.'@accept', [
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
