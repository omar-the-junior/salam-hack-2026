<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Laravel\Ai\Providers\Tools\WebSearch;
use Stringable;

#[Provider(Lab::Gemini)]
class CancelSubscriptionInstructionsAgent implements Agent, HasStructuredOutput, HasTools
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return 'You are a subscription cancellation assistant. When given a service name, use web search to find the most up-to-date cancellation procedure and return structured data.';
    }

    /**
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new WebSearch,
        ];
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'cancel_url' => $schema->string()->nullable(),
            'steps' => $schema->array()->items($schema->string())->required(),
            'notes' => $schema->string()->nullable(),
            'confidence' => $schema->string()->enum(['high', 'medium', 'low'])->required(),
        ];
    }
}
