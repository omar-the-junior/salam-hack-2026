<?php

namespace App\Http\Controllers;

use App\Http\Requests\Customers\StoreCustomerRequest;
use App\Http\Requests\Customers\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        $customers = Customer::query()
            ->where('user_id', auth()->id())
            ->withCount('paymentLinks')
            ->latest()
            ->get(['id', 'name', 'email', 'phone', 'notes', 'created_at']);

        return Inertia::render('customers/index', [
            'customers' => $customers,
        ]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
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

        return redirect()->route('customers.index')
            ->with('flash', ['type' => 'success', 'message' => 'تمت إضافة العميل بنجاح']);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $this->authorizeCustomer($customer);

        $customer->update($request->validated());

        return redirect()->back()
            ->with('flash', ['type' => 'success', 'message' => 'تم تحديث بيانات العميل']);
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $this->authorizeCustomer($customer);

        $customer->delete();

        return redirect()->back()
            ->with('flash', ['type' => 'success', 'message' => 'تم حذف العميل']);
    }

    private function authorizeCustomer(Customer $customer): void
    {
        if ($customer->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
