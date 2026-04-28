# Financial OS — Database Design

This document outlines the database schema for the Financial OS MVP, based on the Product Requirements Document (PRD) and Use Cases (UC-001 through UC-013).

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PAYMENT_LINKS : owns
    USERS ||--o{ CONTRACTS : owns
    USERS ||--o{ INCOME_ENTRIES : logs
    USERS ||--o{ EXPENSE_CARDS : tracks
    USERS ||--o{ CONNECTED_ACCOUNTS : connects
    USERS ||--o{ EMAIL_SCANS : initiates
    USERS ||--o{ RENEWAL_ALERTS : receives
    
    CONTRACTS ||--o{ MILESTONES : contains
    CONTRACTS ||--o{ PAYMENT_LINKS : generates
    MILESTONES ||--o{ PAYMENT_LINKS : triggers
    MILESTONES ||--o{ INCOME_ENTRIES : auto_logs_from
    
    PAYMENT_LINKS ||--o{ INCOME_ENTRIES : creates
    
    EMAIL_SCANS ||--o{ EMAIL_SCAN_RESULTS : contains
    EMAIL_SCAN_RESULTS ||--o{ EXPENSE_CARDS : approves_into
    
    EXPENSE_CARDS ||--o{ RENEWAL_ALERTS : triggers

    USERS {
        uuid id PK
        string email UK
        string password_hash "nullable"
        string provider_id "nullable, for OAuth login"
        string avatar_url "nullable"
        string name
        string display_name
        enum role "freelancer|small_business"
        string country "EG|SA|AE|OTHER"
        string preferred_currency "EGP|USD"
        string profession
        decimal default_tax_rate
        boolean onboarding_completed
        datetime created_at
        datetime updated_at
    }

    PAYMENT_LINKS {
        uuid id PK
        uuid user_id FK
        string public_token UK
        decimal amount "subtotal"
        decimal tax_rate
        decimal tax_amount
        decimal total_amount
        string currency "EGP|USD"
        string description
        string client_name
        string client_email
        date due_date
        enum status "Pending|Paid|Overdue"
        string source "manual|milestone"
        uuid milestone_id FK "nullable"
        string mock_gateway_reference
        string mock_provider
        datetime paid_at "nullable"
        string mock_transaction_id
        datetime created_at
        datetime updated_at
    }

    CONTRACTS {
        uuid id PK
        uuid user_id FK
        string contract_token UK
        string project_name
        text description
        string client_name
        string client_email
        decimal total_value "subtotal pre-tax"
        decimal tax_rate
        decimal tax_amount
        decimal grand_total
        string currency "EGP|USD"
        date start_date
        date end_date
        text terms
        enum status "draft|active|completed"
        datetime signed_at "nullable"
        string client_ip "nullable"
        datetime created_at
        datetime updated_at
    }

    MILESTONES {
        uuid id PK
        uuid contract_id FK
        string title
        decimal percentage "0-100"
        decimal amount "computed"
        date due_date
        enum status "pending|in_progress|submitted|paid"
        uuid payment_link_id FK "nullable"
        datetime created_at
        datetime updated_at
    }

    INCOME_ENTRIES {
        uuid id PK
        uuid user_id FK
        decimal amount
        string currency "EGP|USD"
        date date
        enum source "payment_link|manual|email_parsed"
        string source_label "Upwork|Fiverr|etc"
        string client_name
        string category "Freelance|Product Sale|Consulting|Content|Other"
        text description
        string reference_id UK "nullable"
        datetime created_at
        datetime updated_at
    }

    EXPENSE_CARDS {
        uuid id PK
        uuid user_id FK
        string name "service name"
        enum category "saas|tool|equipment|marketing|other"
        enum type "recurring|one-time"
        decimal amount
        string currency "EGP|USD"
        enum billing_cycle "monthly|annual|one-time"
        date next_renewal_date
        date started_at
        enum status "active|paused|cancelled"
        string cancel_url
        text cancel_instructions
        text notes
        int alert_days_before
        boolean auto_detected
        string source_email_id "nullable"
        datetime last_alerted_at "nullable"
        datetime created_at
        datetime updated_at
    }

    CONNECTED_ACCOUNTS {
        uuid id PK
        uuid user_id FK "unique per provider"
        string provider "gmail"
        string email "connected email"
        text access_token "encrypted"
        text refresh_token "encrypted"
        datetime token_expires_at
        datetime created_at
        datetime updated_at
    }

    EMAIL_SCANS {
        uuid id PK
        uuid user_id FK
        enum status "queued|in_progress|completed|failed"
        datetime started_at
        datetime completed_at
        int found_count
        text error_message
        datetime created_at
    }

    EMAIL_SCAN_RESULTS {
        uuid id PK
        uuid email_scan_id FK
        uuid user_id FK
        string service_name
        decimal amount
        string currency
        enum billing_cycle "monthly|annual|one-time|unknown"
        date billing_date
        enum confidence "high|medium|low"
        string raw_email_id UK "Gmail message ID"
        string raw_email_subject
        text raw_email_snippet
        enum status "pending|approved|rejected"
        datetime created_at
    }

    RENEWAL_ALERTS {
        uuid id PK
        uuid user_id FK
        uuid expense_card_id FK
        datetime alerted_at
        datetime dismissed_at "nullable"
        datetime created_at
    }
```

## Schema Summary

### Core Tables (Authentication & Profile)
- **`users`**: Stores credentials and profile data (name, country, currency, profession, onboarding status).

### Module 1: Payment Links & Contracts
- **`payment_links`**: Tracks standalone or milestone-based payment requests with tax breakdown, status tracking, mock gateway reference, and source attribution.
- **`contracts`**: Manages project agreements with contract lifecycle (draft → active → completed) and digital acceptance (signed_at, client_ip).
- **`milestones`**: Breaks down contracts into stages, tracking lifecycle and linking directly to payment links.

### Module 2: Income Management
- **`income_entries`**: Tracks income from multiple sources (payment links, manual entry, email-parsed) with categories and reference IDs to prevent duplicate entries.

### Module 3: Expenses & Subscriptions
- **`expense_cards`**: Manages recurring/one-time expenses, cancellation instructions, auto-detection flags, and renewal alerting configurations.
- **`renewal_alerts`**: Tracks alert history and user dismissals to prevent redundant notifications.

### Module 4: AI Subscription Scanner (Email Agent)
- **`connected_accounts`**: Stores encrypted OAuth tokens (e.g., Gmail) linking an email provider to the user.
- **`email_scans`**: Tracks background scan jobs (queued → in_progress → completed/failed).
- **`email_scan_results`**: Stores parsed subscription candidates extracted by AI, including confidence scores and reference IDs, pending user approval.

## Key Design Patterns

- **Tax Breakdown**: Stored as separate fields (`tax_rate`, `tax_amount`, `total_amount`) for both payment links and contracts to ensure clear financial reporting.
- **Source Attribution**: Utilizes `reference_id` on income entries, `source_email_id` on expense cards, and the `source` field on payment links for complete income traceability.
- **Idempotency**: Unique constraints on tokens, email IDs, and reference IDs prevent duplicate records, especially important for webhook parsing and email scanning.
- **Status Enums**: Each entity tracks its own lifecycle status (e.g., Pending → Paid, draft → active → completed, queued → completed).
- **Multi-Currency**: EGP and USD are supported throughout, mapped back to the configurable defaults per user.
- **Digital Acceptance**: Contracts record the `signed_at` timestamp and `client_ip` to provide proof of e-signature acceptance.
