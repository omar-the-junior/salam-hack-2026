<?php

namespace App\Services\Expense;

use App\Ai\Agents\CancelSubscriptionInstructionsAgent;
use App\Ai\Agents\CancelSubscriptionInstructionsOpenRouterAgent;
use App\Models\ExpenseCard;
use Throwable;

class CancelSubscriptionInstructionService
{
    /**
     * @return array{
     *     success: bool,
     *     cancel_url: string|null,
     *     cancel_instructions: string|null,
     *     confidence: string|null,
     *     error: string|null,
     * }
     */
    public function fetch(ExpenseCard $card): array
    {
        try {
            $data = $this->fetchFromGemini($card->name);
        } catch (Throwable $e) {
            if ($this->isQuotaError($e)) {
                try {
                    $data = $this->fetchFromOpenRouter($card->name);
                } catch (Throwable) {
                    return $this->failure();
                }
            } else {
                return $this->failure();
            }
        }

        $instructions = $this->formatAsMarkdown($data['steps'] ?? [], $data['notes'] ?? null);
        $cancelUrl = $data['cancel_url'] ?? null;

        $card->update([
            'cancel_url' => $cancelUrl ?? $card->cancel_url,
            'cancel_instructions' => $instructions,
        ]);

        return [
            'success' => true,
            'cancel_url' => $cancelUrl ?? $card->cancel_url,
            'cancel_instructions' => $instructions,
            'confidence' => $data['confidence'] ?? 'low',
            'error' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchFromGemini(string $serviceName): array
    {
        $response = (new CancelSubscriptionInstructionsAgent)->prompt(
            "The user wants to cancel their \"{$serviceName}\" subscription. Find the most up-to-date cancellation steps and direct cancel URL.",
            model: (string) config('ai.cancel_subscription.model', 'gemini-3-flash-preview'),
            timeout: (int) config('ai.cancel_subscription.timeout', 30),
        );

        return [
            'cancel_url' => $response['cancel_url'] ?? null,
            'steps' => (array) ($response['steps'] ?? []),
            'notes' => $response['notes'] ?? null,
            'confidence' => $response['confidence'] ?? 'low',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchFromOpenRouter(string $serviceName): array
    {
        $response = (new CancelSubscriptionInstructionsOpenRouterAgent)->prompt(
            "The user wants to cancel their \"{$serviceName}\" subscription. Return the JSON object with cancel_url, steps, notes, and confidence.",
            model: (string) config('ai.cancel_subscription.openrouter_model', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'),
            timeout: (int) config('ai.cancel_subscription.timeout', 30),
        );

        $text = (string) $response;

        // Extract JSON block if the model wraps it in markdown fences
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $text, $match)) {
            $text = $match[1];
        } elseif (preg_match('/(\{.*\})/s', $text, $match)) {
            $text = $match[1];
        }

        /** @var array<string, mixed>|null $data */
        $data = json_decode($text, true);

        if (! is_array($data)) {
            throw new \RuntimeException('OpenRouter returned non-JSON response.');
        }

        return [
            'cancel_url' => isset($data['cancel_url']) && is_string($data['cancel_url']) ? $data['cancel_url'] : null,
            'steps' => isset($data['steps']) && is_array($data['steps']) ? array_values(array_map('strval', $data['steps'])) : [],
            'notes' => isset($data['notes']) && is_string($data['notes']) ? $data['notes'] : null,
            'confidence' => in_array($data['confidence'] ?? '', ['high', 'medium', 'low'], true)
                ? (string) $data['confidence']
                : 'low',
        ];
    }

    private function isQuotaError(Throwable $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, '429')
            || str_contains($message, 'quota')
            || str_contains($message, 'resource_exhausted')
            || str_contains($message, 'rate limit')
            || str_contains($message, 'rate_limit');
    }

    /**
     * @return array{success: false, cancel_url: null, cancel_instructions: null, confidence: null, error: string}
     */
    private function failure(): array
    {
        return [
            'success' => false,
            'cancel_url' => null,
            'cancel_instructions' => null,
            'confidence' => null,
            'error' => 'Couldn\'t fetch instructions right now. Try again or search manually.',
        ];
    }

    /**
     * @param  list<string>  $steps
     */
    private function formatAsMarkdown(array $steps, ?string $notes): string
    {
        $lines = [];

        foreach ($steps as $index => $step) {
            $lines[] = ($index + 1).'. '.$step;
        }

        if ($notes !== null && $notes !== '') {
            $lines[] = '';
            $lines[] = '> '.$notes;
        }

        return implode("\n", $lines);
    }
}
