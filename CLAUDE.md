# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Comma Education** - an educational SaaS platform built with Next.js 14, Supabase, and TypeScript. The application manages classes, sessions, tutors, students, and payments for an online education platform with integrated Zoom video conferencing.

## Key Commands

### Development
- `npm run dev` - Start Next.js development server with pretty logging
- `npm run dev:test` - Start development server in test environment
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking on both main code and Cypress tests
- `npm run format` - Format code with Prettier

### Database & Backend
- `npm run supabase:start` - Start local Supabase instance (Docker required)
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:db:reset` - Reset local database
- `npm run typegen` - Generate TypeScript types from Supabase schema
- `npm run stripe:listen` - Start Stripe webhook listener (Docker required)

### Testing
- `npm run test:e2e` - Run end-to-end tests via `./scripts/test.sh`
- `npm run test:db` - Run database tests with debug output
- `npm run test:reset:db` - Reset database and run tests
- `npm run cypress` - Open Cypress test runner
- `npm run cypress:headless` - Run Cypress tests headlessly

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS with HeroUI components and Radix UI
- **Video**: Zoom Meeting SDK and Video SDK integration  
- **Payments**: Stripe with webhook handling
- **Email**: AWS SES and Nodemailer
- **Async Processing**: Upstash QStash for long-running operations
- **Testing**: Cypress for E2E testing
- **Monitoring**: Sentry for error tracking

### Layered Architecture Pattern

The codebase follows a strict 3-layer architecture pattern defined in `.cursor/rules/backend-pattern-rule.mdc`:

1. **Server Actions Layer** (`server-actions-v2.ts`) - Orchestration, validation, CSRF handling
2. **Services Layer** (`services/*.service.ts`) - Business logic and domain operations  
3. **Database Layer** (`database/mutations-v2.ts`, `queries.ts`) - Data access operations

All operations use the Result pattern (`Result<T, E>`) with proper error handling and logging.

### Module Structure
```
src/lib/{module}/
├── server-actions-v2.ts    # Orchestration layer
├── services/               # Business logic
│   └── {module}.service.ts
├── database/              # Data access
│   ├── mutations-v2.ts
│   └── queries.ts
├── types/                 # Type definitions
│   └── {module}-v2.ts
├── hooks/                 # React hooks (if needed)
└── constants/             # Module constants
```

### Key Modules
- **Classes** (`src/lib/classes/`) - Class group management and enrollment
- **Sessions** (`src/lib/sessions/`) - Individual session management with Zoom integration
- **User** (`src/lib/user/`) - User management (students, tutors, admins)
- **Payments** (`src/lib/payments/`, `student-payments/`, `tutor-payments/`) - Payment processing
- **Invoices** (`src/lib/invoices/`) - Invoice generation and management
- **Zoom** (`src/lib/zoom/`) - Zoom integration for video conferencing
- **Notifications** (`src/lib/notifications/`) - Email and SMS notifications

### Role-Based Access Control
The application supports three user roles:
- **Admin** - Full platform management access
- **Tutor** - Can manage their classes and sessions
- **Student** - Can view enrolled classes and attend sessions

Navigation and features are role-controlled (see `src/navigation.config.tsx`).

### Database Schema
Core tables include:
- `users` - User accounts with role-based permissions
- `classes` - Class groups that contain multiple sessions
- `sessions` / `recurring_sessions` - Individual learning sessions
- `student_class_enrollments` - Class enrollment tracking
- `student_session_attendance` - Session attendance tracking
- `student_payments` / `tutor_payments` - Payment records
- `invoices` / `tutor_invoices` - Invoice management
- `zoom_users` / `zoom_sessions` - Zoom integration data

## Important Development Notes

### Code Quality Standards
- **Never modify files without user permission** - Always present an action plan first
- Use the Result pattern for all operations: `success(data)` or `failure(error)`
- Follow the layered architecture pattern strictly
- Use proper TypeScript types from `database.types.ts`
- Include comprehensive error handling and logging
- Follow the import order: external libs → core utils → database ops → services → types → constants

### Environment Setup
1. Start Supabase: `npm run supabase:start`
2. Copy the anon key and service role key to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Generate types: `npm run typegen`
4. Start development: `npm run dev`

### Testing Approach
- E2E tests with Cypress covering auth, profiles, admin features, and Stripe workflows
- Database tests using Supabase's testing framework
- Test credentials: `test@makerkit.dev` / `testingpassword`
- InBucket for email testing: http://localhost:54324/monitor

### Key Configuration Files
- `src/configuration.ts` - App-wide settings including auth providers and Stripe plans
- `src/navigation.config.tsx` - Role-based navigation structure
- `next.config.js` - Next.js config with Zoom SDK webpack setup
- `tailwind.config.js` - Tailwind with HeroUI theme configuration

### Special Features
- **Zoom Integration** - Meeting SDK for video sessions with custom UI
- **Async Processing** - QStash for handling long-running class creation operations
- **File Upload** - AWS S3 integration for resource materials
- **Multi-tenant** - Role-based access with different user experiences
- **Responsive Design** - Mobile and desktop optimized interface

### Current Branch Context
You are working on branch `feat/com-188-classjoin` which appears to be implementing class joining functionality.

## Quick Reference

- **Default test user**: `test@makerkit.dev` / `testingpassword`  
- **Local Supabase Studio**: http://localhost:54323
- **Email testing**: http://localhost:54324/monitor
- **Main development command**: `npm run dev`
- **Type checking before commits**: `npm run typecheck`
- **Database reset**: `npm run supabase:db:reset`