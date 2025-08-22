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

## Architecture Standards

This project follows a strict 3-layer architecture pattern with clear separation of concerns. **ALL CODE MUST ADHERE TO THESE STANDARDS.**

### 1. Server Actions (Orchestration Layer)
- **Location**: `src/lib/{module}/server-actions-v2.ts`
- **Responsibility**: Workflow orchestration, validation, and side effects
- **Pattern**: Use `withSession` wrapper, handle CSRF, revalidate paths

```typescript
export const actionName = withSession(
  async (params: ActionParams): Promise<ActionResponse> => {
    const client = getSupabaseServerActionClient();
    const logger = getLogger();
    const service = new ModuleService(client, logger);
    
    try {
      await verifyCsrfToken(params.csrfToken);
      
      const result = await service.operation(params.data);
      if (!result.success) {
        return actionFailure(result.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
      }
      
      revalidatePath('/path');
      return actionSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return actionFailure(errorMessage, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
);
```

### 2. Services (Business Logic Layer)
- **Location**: `src/lib/{module}/services/*.service.ts`
- **Responsibility**: Business logic, validation, and domain operations
- **Pattern**: Use Result pattern, proper logging, error handling

```typescript
export class ModuleService {
  constructor(
    private client: SupabaseClient<Database>,
    private logger: Logger
  ) {}

  async operationName(params): Promise<Result<T>> {
    try {
      const result = await databaseOperation(this.client, params);
      
      if (!result.success) {
        this.logger.error('Business logic error', { error: result.error });
        return failure(new ServiceError(result.error.message));
      }
      
      return success(result.data);
    } catch (error) {
      this.logger.error('Service error', { error });
      return failure(new ServiceError('Service error message'));
    }
  }
}
```

### 3. Database Operations (Data Access Layer)
- **Location**: `src/lib/{module}/database/mutations-v2.ts`, `queries.ts`
- **Responsibility**: Single database operations with proper error handling
- **Pattern**: Use Result pattern, comprehensive logging, type safety

```typescript
export async function operationName(
  client: Client, 
  params: OperationParams
): Promise<Result<T, DatabaseError>> {
  try {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select() // or .insert(), .update(), .delete()
      .eq('id', id)
      .throwOnError()
      .single();

    if (error) {
      logger.error('Specific error message', error);
      return failure(new DatabaseError('User-friendly error message'));
    }

    return success(data);
  } catch (error) {
    logger.error('Something went wrong while [action]', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      // Add relevant context
    });
    return failure(new DatabaseError('Something went wrong while [action]'));
  }
}
```

## Type Safety Standards

### Database Types
- Always import: `import type { Database } from '~/database.types'`
- Use: `type Client = SupabaseClient<Database>`
- Use database types: `Database['public']['Tables']['table_name']['Insert']`

### Type Definitions
- **Location**: `src/lib/{module}/types/*.ts`
- Use PascalCase for types: `CreateClassParams`, `UpdateClassData`
- Extend database types when needed

## Error Handling Standards

### Result Pattern
- Use `Result<T, E>` for all operations
- Use `success(data)` and `failure(error)` helpers
- Use `ErrorCodes` enum for categorization

### Error Codes
Use these standard error codes:
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `SERVICE_LEVEL_ERROR`: Business logic error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: Third-party service error
- `INTERNAL_SERVER_ERROR`: Unexpected error

### Logging Standards
```typescript
logger.error('Error message', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  name: error instanceof Error ? error.name : undefined,
  // Add relevant context
});
```

## Naming Conventions

### Functions and Methods
- Database functions: `camelCase` (createClass, updateClass, getClassById)
- Services: `PascalCase` + Service suffix (ClassService, SessionService)
- Actions: `camelCase` + Action suffix (createClassAction, updateClassAction)

### Files
- Use `kebab-case`: `server-actions-v2.ts`, `mutations-v2.ts`
- Use descriptive names: `class.service.ts`, `invoice.types.ts`

## Import Organization

### Standard Import Order
```typescript
// External libraries
import { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Internal core utilities
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import getLogger from '~/core/logger';

// Database operations
import { createClass, updateClass } from './database/mutations-v2';
import { getClassById } from './database/queries';

// Services
import { ClassService } from './services/class.service';

// Types
import type { CreateClassParams, CreateClassResponse } from './types/class-v2';

// Constants
import { ErrorCodes } from '~/lib/shared/error-codes';
```

## Code Quality Standards

### Core Principles
- **Never modify files without user permission** - Always present an action plan first
- **Single Responsibility**: Each function/class has one clear purpose
- **Type Safety**: Use TypeScript types throughout
- **Error Handling**: Always handle errors gracefully
- **Logging**: Log errors with context
- **Testing**: Write tests for each layer
- **Documentation**: Document complex logic
- **Consistency**: Follow established patterns
- **Performance**: Consider performance implications
- **Security**: Validate inputs and handle sensitive data
- **Maintainability**: Write code for future developers

### Required Patterns
- Use the Result pattern for all operations: `success(data)` or `failure(error)`
- Follow the layered architecture pattern strictly
- Use proper TypeScript types from `database.types.ts`
- Include comprehensive error handling and logging
- Follow the import order: external libs → core utils → database ops → services → types → constants

### ✅ Always Do
- **Always use server actions for mutations (create/update/delete)**
- **Always use API routes for authenticated user queries/reads**
- **Use API routes in `/api/public/` folder for publicly accessible queries**
- **Always use the logger from `~/core/logger` for all logging**
- **Never use console.log, console.error, console.warn, etc. - always use logger instead**

## React Development Standards

### Rules of Hooks - CRITICAL
React Hooks must follow strict rules to ensure components render consistently:

**❌ NEVER call hooks conditionally:**
```typescript
// BAD - Hooks called after conditional return
const MyComponent = ({ user }) => {
  if (user) {
    return <SignedInComponent user={user} />;
  }
  
  const [data, setData] = useState(null); // ERROR: Hook called conditionally
  const mutation = useMutation(); // ERROR: Hook called conditionally
  
  return <SignedOutComponent />;
};
```

**✅ ALWAYS call hooks at the top level:**
```typescript
// GOOD - All hooks called before any conditional logic
const MyComponent = ({ user }) => {
  const [data, setData] = useState(null); // ✅ Hook at top level
  const mutation = useMutation(); // ✅ Hook at top level
  
  if (user) {
    return <SignedInComponent user={user} />;
  }
  
  return <SignedOutComponent />;
};
```

### React Hook Guidelines
- **All hooks must be called at the top of the component**
- **Never call hooks inside loops, conditions, or nested functions**
- **Always call hooks in the same order on every render**
- **Move conditional logic AFTER all hook declarations**
- **Use early returns only AFTER all hooks are declared**

### Interface Consistency
- **Avoid duplicate interfaces** - Use centralized type definitions
- **Extend existing types** when adding fields rather than creating duplicates
- **Import from centralized locations** like `~/core/session/types/user-data`

### Security in Components
- **Never use hardcoded fallback values** that could pollute the database
- **Always validate required data** before processing
- **Provide clear error messages** when validation fails
- **Use secure random generation** for passwords and tokens
- **Reject operations** when required user data is missing

### Environment Setup
1. Start Supabase: `npm run supabase:start`
2. Copy the anon key and service role key to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Generate types: `npm run typegen`
4. Start development: `npm run dev`

## Testing Standards

### Test Structure
```
tests/
├── database/     # Test database operations
├── services/     # Test business logic
├── actions/      # Test server actions
└── integration/  # Test complete workflows
```

### Test Patterns
- Test each layer independently
- Mock dependencies appropriately
- Use Result pattern in tests
- Test both success and failure scenarios

### Testing Approach
- E2E tests with Cypress covering auth, profiles, admin features, and Stripe workflows
- Database tests using Supabase's testing framework
- Test credentials: `test@makerkit.dev` / `testingpassword`
- InBucket for email testing: http://localhost:54324/monitor

## Common Implementation Patterns

### Database Operation Pattern
```typescript
export async function createEntity(
  client: Client, 
  data: InsertEntityData
): Promise<Result<Entity, DatabaseError>> {
  try {
    const { data: entity, error } = await client
      .from(ENTITY_TABLE)
      .insert(data)
      .select()
      .throwOnError()
      .single();

    if (error) {
      logger.error('Failed to create entity', error);
      return failure(new DatabaseError('Failed to create entity'));
    }

    return success(entity);
  } catch (error) {
    logger.error('Something went wrong while creating entity', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return failure(new DatabaseError('Something went wrong while creating entity'));
  }
}
```

### Service Method Pattern
```typescript
async createEntity(data: CreateEntityData): Promise<Result<Entity>> {
  try {
    const result = await createEntity(this.client, data);
    
    if (!result.success) {
      this.logger.error('Failed to create entity', { error: result.error });
      return failure(new ServiceError(result.error.message));
    }
    
    this.logger.info('Entity created successfully', { entityId: result.data.id });
    return success(result.data);
  } catch (error) {
    this.logger.error('Service error while creating entity', { error });
    return failure(new ServiceError('Failed to create entity'));
  }
}
```

### Server Action Pattern
```typescript
export const createEntityAction = withSession(
  async (params: CreateEntityParams): Promise<CreateEntityResponse> => {
    const client = getSupabaseServerActionClient();
    const logger = getLogger();
    const service = new EntityService(client, logger);
    
    try {
      await verifyCsrfToken(params.csrfToken);
      
      logger.info('Creating entity', { entityData: params.data });
      
      const result = await service.createEntity(params.data);
      if (!result.success) {
        return createEntityFailure(result.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
      }
      
      revalidatePath('/entities');
      return createEntitySuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return createEntityFailure(errorMessage, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
);
```

## Documentation Standards

### Code Comments
- Add JSDoc for public functions
- Document complex business logic
- Use TODO comments for future improvements
- Explain "why" not "what"

### Examples
```typescript
/**
 * Creates a new class with associated sessions and invoices
 * @param data - Class creation data
 * @returns Result with created class or error
 */
async createClass(data: CreateClassData): Promise<Result<Class>> {
  // Implementation
}
```

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