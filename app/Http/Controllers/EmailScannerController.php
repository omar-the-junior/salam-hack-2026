<?php

namespace App\Http\Controllers;

use App\Models\EmailScan;
use App\Models\EmailScanResult;
use App\Models\ExpenseCard;
use App\Services\Email\EmailScanService;
use App\Services\Gmail\GmailConnectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class EmailScannerController extends Controller
{
    public function __construct(
        private GmailConnectService $gmailConnect
    ) {}

    public function index(): Response
    {
        try {
            $user = auth()->user();
            $account = $user->gmailAccount;
            $scan = $user->latestScan;

            return Inertia::render('email-scanner/index', [
                'connected_account' => $account
                    ? ['email' => $account->email]
                    : null,

                'latest_scan' => $scan
                    ? $scan->only(['id', 'status', 'found_count', 'error_message', 'created_at'])
                    : null,
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

    public function review(): Response
    {
        try {
            $results = EmailScanResult::where('user_id', auth()->id())
                ->whereIn('status', ['pending'])
                ->latest('created_at')
                ->get()
                ->map(fn (EmailScanResult $r) => [
                    'id' => $r->id,
                    'serviceName' => $r->service_name ?? 'غير معروف',
                    'amount' => $r->amount ? (float) $r->amount : null,
                    'currency' => $r->currency,
                    'billingCycle' => $r->billing_cycle,
                    'billingDate' => $r->billing_date?->toDateString(),
                    'confidence' => $r->confidence,
                    'snippet' => $r->raw_email_snippet,
                    'subject' => $r->raw_email_subject,
                    'status' => $r->status,
                ]);

            return Inertia::render('email-scanner/review', [
                'results' => $results,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@review', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function connectAccount(): RedirectResponse
    {
        try {
            $authUrl = $this->gmailConnect->getAuthUrl();

            return redirect($authUrl);
        } catch (Throwable $e) {
            Log::error(static::class.'@connectAccount', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function handleOAuthCallback(Request $request): RedirectResponse
    {
        try {
            if ($request->has('error')) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'لم يتم منح صلاحية Gmail. يمكنك الربط في أي وقت.',
                ]);

                return redirect()->route('email-scanner.index');
            }

            try {
                $this->gmailConnect->handleCallback(
                    user: auth()->user(),
                    code: $request->string('code')
                );
            } catch (\Exception $e) {
                Log::error('Gmail Connect Error in Controller', [
                    'user_id' => auth()->id(),
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'فشل ربط Gmail. حاول مرة أخرى.',
                ]);

                return redirect()->route('email-scanner.index');
            }

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'تم ربط Gmail بنجاح.',
            ]);

            return redirect()->route('email-scanner.index');
        } catch (Throwable $e) {
            Log::error(static::class.'@handleOAuthCallback', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function approveResult(EmailScanResult $result): RedirectResponse
    {
        try {
            abort_unless($result->user_id === auth()->id(), 403);
            abort_unless($result->status === 'pending', 422);

            $billingCycle = in_array($result->billing_cycle, ['monthly', 'annual', 'one-time'])
                ? $result->billing_cycle
                : 'one-time';

            DB::transaction(function () use ($result, $billingCycle) {
                ExpenseCard::create([
                    'user_id' => auth()->id(),
                    'name' => $result->service_name ?? 'غير معروف',
                    'category' => 'saas',
                    'type' => $billingCycle === 'one-time' ? 'one-time' : 'recurring',
                    'amount' => $result->amount ?? 0,
                    'currency' => $result->currency ?? 'USD',
                    'billing_cycle' => $billingCycle,
                    'next_renewal_date' => $result->billing_date,
                    'started_at' => $result->billing_date,
                    'auto_detected' => true,
                    'source_email_id' => $result->raw_email_id,
                ]);

                $result->update(['status' => 'approved']);
            });

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'تم إضافة الاشتراك إلى المصروفات بنجاح.',
            ]);

            return redirect()->route('email-scanner.review');
        } catch (Throwable $e) {
            Log::error(static::class.'@approveResult', [
                'user_id' => auth()->id(),
                'scan_result_id' => $result->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function rejectResult(EmailScanResult $result): RedirectResponse
    {
        try {
            abort_unless($result->user_id === auth()->id(), 403);
            abort_unless($result->status === 'pending', 422);

            $result->update(['status' => 'rejected']);

            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'تم رفض النتيجة.',
            ]);

            return redirect()->route('email-scanner.review');
        } catch (Throwable $e) {
            Log::error(static::class.'@rejectResult', [
                'user_id' => auth()->id(),
                'scan_result_id' => $result->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function approveAllResults(): RedirectResponse
    {
        try {
            $results = EmailScanResult::where('user_id', auth()->id())
                ->where('status', 'pending')
                ->get();

            DB::transaction(function () use ($results) {
                foreach ($results as $result) {
                    $billingCycle = in_array($result->billing_cycle, ['monthly', 'annual', 'one-time'])
                        ? $result->billing_cycle
                        : 'one-time';

                    ExpenseCard::create([
                        'user_id' => auth()->id(),
                        'name' => $result->service_name ?? 'غير معروف',
                        'category' => 'saas',
                        'type' => $billingCycle === 'one-time' ? 'one-time' : 'recurring',
                        'amount' => $result->amount ?? 0,
                        'currency' => $result->currency ?? 'USD',
                        'billing_cycle' => $billingCycle,
                        'next_renewal_date' => $result->billing_date,
                        'started_at' => $result->billing_date,
                        'auto_detected' => true,
                        'source_email_id' => $result->raw_email_id,
                    ]);

                    $result->update(['status' => 'approved']);
                }
            });

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'تم اعتماد جميع النتائج بنجاح.',
            ]);

            return redirect()->route('email-scanner.review');
        } catch (Throwable $e) {
            Log::error(static::class.'@approveAllResults', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function disconnect(): RedirectResponse
    {
        try {
            $this->gmailConnect->disconnect(auth()->user());

            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'تم فصل Gmail. نتائج الفحص السابقة محفوظة.',
            ]);

            return redirect()->route('email-scanner.index');
        } catch (Throwable $e) {
            Log::error(static::class.'@disconnect', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function scan(EmailScanService $emailScanService): RedirectResponse|JsonResponse
    {
        try {
            $user = auth()->user();

            if (! $user->gmailAccount) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'يرجى ربط حساب Gmail أولاً.',
                ]);

                return redirect()->route('email-scanner.index');
            }

            $running = EmailScan::where('user_id', $user->id)
                ->whereIn('status', ['queued', 'in_progress'])
                ->exists();

            if ($running) {
                if (request()->wantsJson()) {
                    return response()->json(['message' => 'الفحص قيد التنفيذ بالفعل.'], 409);
                }

                return back();
            }

            set_time_limit(600);

            $scan = EmailScan::create([
                'user_id' => $user->id,
                'status' => 'queued',
            ]);

            $scan = $emailScanService->run($user, $scan);

            if ($scan->status === 'completed') {
                $count = $scan->found_count ?? 0;
                Inertia::flash('toast', [
                    'type' => 'success',
                    'message' => $count > 0
                        ? 'اكتمل الفحص — تم العثور على '.$count.' اشتراك(ات). يمكنك مراجعة النتائج.'
                        : 'اكتمل الفحص — لم يتم العثور على اشتراكات جديدة.',
                ]);
            } else {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'فشل فحص البريد. حاول مرة أخرى لاحقًا.',
                ]);
            }

            return redirect()->route('email-scanner.index');
        } catch (Throwable $e) {
            Log::error(static::class.'@scan', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function status(): JsonResponse
    {
        try {
            $scan = EmailScan::where('user_id', auth()->id())
                ->latest('created_at')
                ->first();

            if (! $scan) {
                return response()->json(['status' => 'none']);
            }

            return response()->json([
                'status' => $scan->status,
                'found_count' => $scan->found_count,
                'error' => $scan->error_message,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@status', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
