<?php

namespace App\Exports;

use App\Models\IncomeEntry;
use App\Models\User;
use App\Services\Income\IncomeDashboardService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class IncomeExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private User $user,
        private IncomeDashboardService $incomeDashboard,
        private Carbon $monthStart,
        private Carbon $monthEnd,
        private string $monthYm,
        private string $source,
        private string $category,
        private ?string $search,
    ) {}

    /**
     * @return Builder<int, IncomeEntry>
     */
    public function query(): Builder
    {
        $sourceFilter = $this->source !== 'all' ? $this->source : null;

        return $this->incomeDashboard->filteredIncomeEntriesQuery(
            $this->user,
            $this->monthStart->copy()->startOfMonth(),
            $this->monthEnd->copy()->endOfMonth(),
            $sourceFilter,
            $this->category,
            $this->search,
        )->orderBy('date', 'asc')->orderBy('id');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Date',
            'Amount',
            'Currency',
            'Source',
            'Client',
            'Category',
            'Description',
        ];
    }

    /**
     * @param  IncomeEntry  $row
     * @return array<int, string|null>
     */
    public function map($row): array
    {
        $sourceDisplay = (string) $row->source;
        if ($row->source_label !== null && $row->source_label !== '') {
            $sourceDisplay .= ' / '.$row->source_label;
        }

        return [
            $row->date->format('Y-m-d'),
            number_format((float) $row->amount, 2, '.', ''),
            $row->currency ?? 'EGP',
            $sourceDisplay,
            $row->client_name,
            $row->category,
            $row->description,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function title(): string
    {
        return 'Income '.$this->monthYm;
    }
}
