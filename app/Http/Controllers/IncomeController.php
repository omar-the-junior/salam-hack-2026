<?php

namespace App\Http\Controllers;

use App\Exports\IncomeExport;
use App\Http\Requests\IncomeEntries\ExportIncomeRequest;
use App\Http\Requests\IncomeEntries\StoreIncomeEntryRequest;
use App\Http\Requests\IncomeEntries\UpdateIncomeEntryRequest;
use App\Models\IncomeEntry;
use App\Models\User;
use App\Services\Income\IncomeDashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class IncomeController extends Controller
{
    public function __construct(
        private IncomeDashboardService $incomeDashboard,
    ) {}

    public function index(Request $request): Response
    {
        try {
            $user = $request->user();
            assert($user !== null);

            $preferred = in_array($user->preferred_currency, ['EGP', 'USD']) ? $user->preferred_currency : 'EGP';

            $monthString = $request->query('month', now()->format('Y-m'));

            try {
                $month = Carbon::createFromFormat('Y-m', (string) $monthString)->startOfMonth();
            } catch (Throwable) {
                $month = now()->startOfMonth();
            }

            $monthEnd = $month->copy()->endOfMonth();

            $sourceRaw = $request->query('source');
            $sourceFilter = is_string($sourceRaw) && $sourceRaw !== '' ? $sourceRaw : 'all';

            $categoryRaw = $request->query('category');
            $categorySlug = is_string($categoryRaw) && $categoryRaw !== '' ? $categoryRaw : 'all';

            $searchRaw = $request->query('search');
            $search = is_string($searchRaw) ? trim($searchRaw) : null;
            if ($search === '') {
                $search = null;
            }

            $paginator = $this->incomeDashboard->paginatedEntries(
                $user,
                $month->copy(),
                $monthEnd->copy(),
                $sourceFilter !== 'all' ? $sourceFilter : null,
                $categorySlug,
                $search,
                20,
            );

            /** @phpstan-ignore-next-line */
            $entries = $paginator->through(fn (IncomeEntry $entry): array => [
                'id' => $entry->id,
                'amount' => (float) $entry->amount,
                'currency' => $entry->currency,
                'source' => $entry->source,
                'client' => ($entry->client_name !== null && $entry->client_name !== '')
                    ? $entry->client_name
                    : '—',
                'category' => $this->categoryArabicLabel($entry->category),
                'category_key' => $this->slugForCategoryLabel($entry->category) ?? '',
                'date' => $entry->date->toDateString(),
                'description' => $entry->description ?? '',
                'is_overdue' => false,
            ]);

            return Inertia::render('income/index', [
                'filters' => [
                    'month' => $month->format('Y-m'),
                    'source' => $sourceFilter,
                    'category' => $categorySlug,
                    'search' => $search ?? '',
                ],
                'monthLabel' => $month->copy()->locale('ar')->translatedFormat('F Y'),
                'monthTotalsByCurrency' => $this->incomeDashboard->monthTotalsByCurrency(
                    $user,
                    $month->copy()->startOfMonth(),
                    $monthEnd->copy()->endOfMonth(),
                    $sourceFilter !== 'all' ? $sourceFilter : null,
                    $categorySlug,
                    $search,
                ),
                'preferredCurrency' => $preferred,
                'outstanding' => $this->incomeDashboard->paymentLinkOutstanding($user),
                'chartThisMonthByWeek' => $this->incomeDashboard->chartThisMonthByWeek($user, $preferred),
                'chartLastSixMonths' => $this->incomeDashboard->chartLastSixMonths($user, $preferred),
                'categoryFilterOptions' => $this->incomeDashboard->categoryFilterOptions($user),
                'hasAnyIncomeEver' => IncomeEntry::query()->where('user_id', $user->id)->exists(),
                'incomeEntries' => $entries,
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

    public function create(Request $request): Response
    {
        try {
            $user = $request->user();
            assert($user !== null);

            return Inertia::render('income/create', [
                'defaults' => [
                    'currency' => $user->preferred_currency === 'USD' ? 'USD' : 'EGP',
                    'date' => now()->toDateString(),
                ],
                'categories' => [
                    ['slug' => 'freelance', 'label' => 'عمل حر'],
                    ['slug' => 'product_sale', 'label' => 'بيع منتج'],
                    ['slug' => 'consulting', 'label' => 'استشارات'],
                    ['slug' => 'content', 'label' => 'صناعة محتوى'],
                    ['slug' => 'other', 'label' => 'أخرى'],
                ],
                'source_labels' => [
                    ['slug' => 'upwork', 'label' => 'Upwork'],
                    ['slug' => 'fiverr', 'label' => 'Fiverr'],
                    ['slug' => 'bank_transfer', 'label' => 'تحويل بنكي'],
                    ['slug' => 'fawry', 'label' => 'فوري'],
                    ['slug' => 'vodafone_cash', 'label' => 'Vodafone Cash'],
                    ['slug' => 'other', 'label' => 'أخرى'],
                ],
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

    public function store(StoreIncomeEntryRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $categorySlug = $validated['category'];
            $categoryLabel = IncomeDashboardService::slugToCategoryLabel($categorySlug);
            if ($categoryLabel === null) {
                abort(422);
            }

            IncomeEntry::create([
                'user_id' => (string) auth()->id(),
                'amount' => $validated['amount'],
                'currency' => $validated['currency'],
                'date' => $validated['date'],
                'source' => 'manual',
                'source_label' => IncomeDashboardService::slugToSourceLabel($validated['source_label'] ?? null) ?? 'Other',
                'client_name' => $validated['client_name'] ?? null,
                'category' => $categoryLabel,
                'description' => $validated['description'] ?? null,
                'reference_id' => null,
            ]);

            $entryMonth = Carbon::parse($validated['date'])->format('Y-m');

            return redirect()->route('income.index', ['month' => $entryMonth])
                ->with('flash', ['type' => 'success', 'message' => 'تمت إضافة الإيراد بنجاح.']);
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function update(UpdateIncomeEntryRequest $request, IncomeEntry $incomeEntry): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $payload = [];

            if (array_key_exists('amount', $validated)) {
                $payload['amount'] = $validated['amount'];
            }

            if (array_key_exists('currency', $validated)) {
                $payload['currency'] = $validated['currency'];
            }

            if (array_key_exists('date', $validated)) {
                $payload['date'] = $validated['date'];
            }

            if (array_key_exists('client_name', $validated)) {
                $payload['client_name'] = $validated['client_name'];
            }

            if (array_key_exists('description', $validated)) {
                $payload['description'] = $validated['description'];
            }

            if (array_key_exists('category', $validated)) {
                $cat = IncomeDashboardService::slugToCategoryLabel($validated['category']);
                if ($cat === null) {
                    abort(422);
                }
                $payload['category'] = $cat;
            }

            if (array_key_exists('source_label', $validated)) {
                $payload['source_label'] = IncomeDashboardService::slugToSourceLabel($validated['source_label']) ?? 'Other';
            }

            if ($payload !== []) {
                $incomeEntry->update($payload);
            }

            return redirect()->back()
                ->with('flash', ['type' => 'success', 'message' => 'تم تحديث الإيراد.']);
        } catch (Throwable $e) {
            Log::error(static::class.'@update', [
                'user_id' => auth()->id(),
                'income_entry_id' => $incomeEntry->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function exportExcel(ExportIncomeRequest $request): BinaryFileResponse|RedirectResponse
    {
        try {
            return $this->download($request, ExcelWriter::XLSX, 'xlsx');
        } catch (Throwable $e) {
            Log::error(static::class.'@exportExcel', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function exportCsv(ExportIncomeRequest $request): BinaryFileResponse|RedirectResponse
    {
        try {
            return $this->download($request, ExcelWriter::CSV, 'csv');
        } catch (Throwable $e) {
            Log::error(static::class.'@exportCsv', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function download(
        ExportIncomeRequest $request,
        string $writerType,
        string $extension,
    ): BinaryFileResponse|RedirectResponse {
        $context = $this->resolveExportContext($request);

        if (! $context['hasData']) {
            return redirect()->back()->with('flash', [
                'type' => 'error',
                'message' => 'لا توجد إيرادات مطابقة للتصدير.',
            ]);
        }

        $filename = 'income-'.$context['monthYm'].'.'.$extension;

        return Excel::download(
            new IncomeExport(
                $context['user'],
                $this->incomeDashboard,
                $context['month'],
                $context['monthEnd'],
                $context['monthYm'],
                $context['source'],
                $context['category'],
                $context['search'],
            ),
            $filename,
            $writerType,
        );
    }

    /**
     * @return array{
     *     user: User,
     *     month: Carbon,
     *     monthEnd: Carbon,
     *     monthYm: string,
     *     source: string,
     *     category: string,
     *     search: ?string,
     *     hasData: bool,
     * }
     */
    private function resolveExportContext(ExportIncomeRequest $request): array
    {
        /** @var User $user */
        $user = $request->user();

        $monthString = $request->query('month', now()->format('Y-m'));

        try {
            $month = Carbon::createFromFormat('Y-m', (string) $monthString)->startOfMonth();
        } catch (Throwable) {
            $month = now()->startOfMonth();
        }

        $monthEnd = $month->copy()->endOfMonth();

        $sourceRaw = $request->query('source');
        $sourceFilter = is_string($sourceRaw) && $sourceRaw !== '' ? $sourceRaw : 'all';

        $categoryRaw = $request->query('category');
        $categorySlug = is_string($categoryRaw) && $categoryRaw !== '' ? $categoryRaw : 'all';

        $searchRaw = $request->query('search');
        $search = is_string($searchRaw) ? trim($searchRaw) : null;
        if ($search === '') {
            $search = null;
        }

        $sourceForQuery = $sourceFilter !== 'all' ? $sourceFilter : null;

        $hasData = $this->incomeDashboard->filteredIncomeEntriesQuery(
            $user,
            $month->copy(),
            $monthEnd->copy(),
            $sourceForQuery,
            $categorySlug,
            $search,
        )->exists();

        return [
            'user' => $user,
            'month' => $month,
            'monthEnd' => $monthEnd,
            'monthYm' => $month->format('Y-m'),
            'source' => $sourceFilter,
            'category' => $categorySlug,
            'search' => $search,
            'hasData' => $hasData,
        ];
    }

    private function categoryArabicLabel(string $english): string
    {
        return match ($english) {
            'Freelance' => 'عمل حر',
            'Product Sale' => 'بيع منتج',
            'Consulting' => 'استشارات',
            'Content' => 'صناعة محتوى',
            'Other' => 'أخرى',
            default => $english,
        };
    }

    private function slugForCategoryLabel(string $english): ?string
    {
        return match ($english) {
            'Freelance' => 'freelance',
            'Product Sale' => 'product_sale',
            'Consulting' => 'consulting',
            'Content' => 'content',
            'Other' => 'other',
            default => null,
        };
    }
}
