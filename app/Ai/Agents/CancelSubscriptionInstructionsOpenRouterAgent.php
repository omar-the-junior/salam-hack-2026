<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::OpenRouter)]
class CancelSubscriptionInstructionsOpenRouterAgent implements Agent
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return <<<'INSTRUCTIONS'
You are a subscription cancellation assistant. Based on your training knowledge, provide cancellation instructions for the given service.

Respond ONLY with a valid JSON object using exactly these fields — no markdown, no explanation:
{
  "cancel_url": "direct URL to the cancellation page, or null if unknown",
  "steps": ["step 1", "step 2", ...],
  "notes": "important warnings about refund policy, notice period, data deletion, etc. — or null",
  "confidence": "high | medium | low"
}
INSTRUCTIONS;
    }
}
