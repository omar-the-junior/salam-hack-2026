<?php

namespace App\Http\Controllers;

use App\Http\Requests\Customers\StoreCustomerRequest;
use App\Http\Requests\Customers\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CustomerController extends Controller
{
    public function index(): Response
    {
        try {
            $customers = Customer::query()
                ->where('user_id', auth()->id())
                ->withCount('paymentLinks')
                ->latest()
                ->get(['id', 'name', 'email', 'phone', 'notes', 'created_at']);

            return Inertia::render('customers/index', [
                'customers' => $customers,
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

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $customer = Customer::create([
                'user_id' => auth()->id(),
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $context = $request->input('context');

            if ($context === 'payment-link') {
                return redirect()->route('payment-links.create')
                    ->with('new_customer_id', $customer->id)
                    ->with('flash', ['type' => 'success', 'message' => 'تمت إضافة العميل بنجاح']);
            }

            if ($context === 'contract') {
                return redirect()->route('contracts.create')
                    ->with('new_customer_id', $customer->id)
                    ->with('flash', ['type' => 'success', 'message' => 'تمت إضافة العميل بنجاح']);
            }

            return redirect()->route('customers.index')
                ->with('flash', ['type' => 'success', 'message' => 'تمت إضافة العميل بنجاح']);
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        try {
            $this->authorizeCustomer($customer);

            $customer->update($request->validated());

            return redirect()->back()
                ->with('flash', ['type' => 'success', 'message' => 'تم تحديث بيانات العميل']);
        } catch (Throwable $e) {
            Log::error(static::class.'@update', [
                'user_id' => auth()->id(),
                'customer_id' => $customer->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        try {
            $this->authorizeCustomer($customer);

            $customer->delete();

            return redirect()->back()
                ->with('flash', ['type' => 'success', 'message' => 'تم حذف العميل']);
        } catch (Throwable $e) {
            Log::error(static::class.'@destroy', [
                'user_id' => auth()->id(),
                'customer_id' => $customer->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function authorizeCustomer(Customer $customer): void
    {
        if ($customer->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
