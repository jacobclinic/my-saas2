# Copilot Instructions for Comma-Edu Workspace

## Core Interaction Guidelines

### File Modification Rules

#### 1. Permission-Based Changes
- **Never update files without explicit user permission**
- **Always ask for confirmation before making any code changes**
- **Respect user preferences for code modifications**

#### 2. Action Plan Requirement
When a user requests changes, follow this structured approach:

**Step 1: Analysis**
- Analyze the current codebase structure
- Identify affected files and dependencies
- Understand the user's requirements

**Step 2: Create Detailed Action Plan**
- **List all files that need modification**
- **Provide specific code samples for each change**
- **Explain the reasoning behind each modification**
- **Include potential risks or considerations**
- **Suggest alternative approaches if applicable**

**Step 3: Present Plan to User**
```
## Action Plan: [Brief Description]

### Files to Modify:
1. `path/to/file1.ts` - [Reason for change]
2. `path/to/file2.ts` - [Reason for change]

### Proposed Changes:

#### File 1: `path/to/file1.ts`
```typescript
// Current code
export function oldFunction() {
  // existing implementation
}

// Proposed change
export function newFunction() {
  // new implementation with improvements
}
```

#### File 2: `path/to/file2.ts`
```typescript
// Add new functionality
export const newFeature = {
  // implementation details
}
```

### Benefits:
- [List specific benefits]
- [Performance improvements]
- [Code quality enhancements]

### Risks/Considerations:
- [Any potential issues]
- [Breaking changes]
- [Migration steps if needed]

### Alternative Approaches:
- [Other ways to achieve the goal]
- [Trade-offs between approaches]
```

**Step 4: Wait for Approval**
- **Only proceed after user explicitly approves the plan**
- **Ask clarifying questions if the plan needs refinement**
- **Provide additional details if requested**

## Architecture Overview

### Next.js App Router Architecture
This project uses Next.js App Router with nested layouts:
- `(site)`: Public-facing website pages
- `(app)`: Protected application pages requiring authentication
- `auth`: Authentication-related pages

## Layered Architecture Flow

- **Service Layer**:
  - All business logic must reside in service classes.
  - Service classes should be implemented as singleton instances unless explicitly specified otherwise.
  - Service classes should never contain direct database queries or mutations; they should call query/mutation functions for data access.
  - Always use existing TypeScript types, especially those derived from `database.types.ts` (e.g., `DbClassType = Database['public']['Tables']['classes']['Row']`).

- **Database Layer**:
  - Queries files (`queries.ts`) must contain only database read operations, with no business logic.
  - Mutations files (`mutations-v2.ts` or `mutations.ts`) must contain only database write operations, with no business logic.
  - All types for database operations must be derived from `database.types.ts`.

- **Orchestration Layer**:
  - Orchestration (workflow, validation, side effects) must be handled in server actions (`server-actions-v2.ts`) or API routes.
  - Server actions and API routes should only call service methods, never database queries/mutations directly.

### Example Patterns

```typescript
// Service class singleton pattern
export class ClassService {
  private static instance: ClassService;
  private constructor(private client: SupabaseClient<Database>, private logger: Logger) {}
  static getInstance(client: SupabaseClient<Database>, logger: Logger) {
    if (!ClassService.instance) {
      ClassService.instance = new ClassService(client, logger);
    }
    return ClassService.instance;
  }
  // ...business logic methods...
}

// Database type usage
export type DbClassType = Database['public']['Tables']['classes']['Row'];
```

### Summary Table

| Layer             | File(s)                        | Responsibility                        | Notes                                      |
|-------------------|-------------------------------|----------------------------------------|--------------------------------------------|
| Orchestration     | server-actions-v2.ts, API      | Workflow, validation, side effects     | Only call service methods                  |
| Service           | *.service.ts                   | Business logic                         | Singleton pattern, no direct DB calls      |
| Database (Query)  | queries.ts                     | Read operations only                   | No business logic, use types from DB file  |
| Database (Mutate) | mutations-v2.ts, mutations.ts  | Write operations only                  | No business logic, use types from DB file  |

### Additional Rules

- Never call services, queries, or mutations directly from React components or pages.
- Always use the logger for error handling.
- Always use workspace TypeScript types for all layers.

### Role-Based Access Control
- Components use the `RoleControlledComponent` wrapper or `userRole` context to control visibility
- Role types: `admin`, `tutor`, `student`
- Navigation items are filtered based on user roles in `AppSidebarNavigation.tsx`

### Database Integration
- Uses Supabase with strongly-typed models defined in `src/database.types.ts`
- Database mutations in `<module>/database/mutations-v2.ts` (preferred) or `mutations.ts`
- Database queries in `<module>/database/queries.ts`

### External Services
- Zoom integration for video sessions, using the server-side client in `src/lib/zoom/v2/client.ts`
- Stripe for payments

## Critical Service Call Rules

### ❌ Never Do
- **Never call services directly from React components**
- **Never call services directly from pages**
- **Never use console.log, console.error, etc. - always use logger from `~/core/logger`**

### ✅ Always Do
- **Always use server actions for mutations (create/update/delete)**
- **Always use API routes for authenticated user queries/reads**
- **Use API routes in `/api/public/` folder for publicly accessible queries**
- **Always use the logger from `~/core/logger` for all logging**

## Architecture Layers

### 1. Server Actions (Orchestration Layer)
- **Location**: `src/lib/{module}/server-actions-v2.ts` (preferred) or `server-actions.ts`
- **Responsibility**: Workflow orchestration, validation, and side effects
- **Pattern**: Use `withSession` wrapper, handle CSRF, revalidate paths

```typescript
import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import getLogger from '~/core/logger';
import { verifyCsrfToken } from '~/core/security/csrf';

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
      logger.error('Action failed', { error: errorMessage, params });
      return actionFailure(errorMessage, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
);
```

### 2. API Routes (for Authenticated Queries)
- **Location**: `src/app/api/` for authenticated routes, `src/app/api/public/` for public routes
- **Responsibility**: Handle read operations for authenticated users and public data
- **Pattern**: Verify authentication, call services, return JSON response

```typescript
import { NextRequest, NextResponse } from 'next/server';
import getLogger from '~/core/logger';
import { getSupabaseRouteHandlerClient } from '~/core/supabase/route-handler-client';

export async function GET(request: NextRequest) {
  const logger = getLogger();
  
  try {
    const client = getSupabaseRouteHandlerClient();
    // Verify authentication for non-public routes
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const service = new ModuleService(client, logger);
    const result = await service.getData();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    
    return NextResponse.json({ data: result.data });
  } catch (error) {
    logger.error('API route failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. Services (Business Logic Layer)
- **Location**: `src/lib/{module}/services/*.service.ts`
- **Responsibility**: Business logic, validation, and domain operations
- **Pattern**: Use Result pattern, proper logging, error handling

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import type { Logger } from '~/core/logger';
import { success, failure, type Result } from '~/core/result';

type Client = SupabaseClient<Database>;

export class ModuleService {
  constructor(
    private client: Client,
    private logger: Logger
  ) {}

  async operationName(params: Params): Promise<Result<T, ServiceError>> {
    try {
      this.logger.info('Starting operation', { params });
      
      const result = await databaseOperation(this.client, params);
      
      if (!result.success) {
        this.logger.error('Business logic error', { error: result.error });
        return failure(new ServiceError(result.error.message));
      }
      
      this.logger.info('Operation completed successfully', { result: result.data });
      return success(result.data);
    } catch (error) {
      this.logger.error('Service error', { error, params });
      return failure(new ServiceError('Service error message'));
    }
  }
}
```

### 4. Database Operations (Data Access Layer)
- **Location**: `src/lib/{module}/database/mutations-v2.ts` (preferred) or `mutations.ts`, `queries.ts`
- **Responsibility**: Single database operations with proper error handling
- **Pattern**: Use Result pattern, comprehensive logging, type safety

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { success, failure, type Result } from '~/core/result';
import { DatabaseError } from '~/core/errors';
import getLogger from '~/core/logger';
import { SOME_TABLE } from '~/lib/db-tables';

type Client = SupabaseClient<Database>;

export async function operationName(
  client: Client, 
  params: OperationParams
): Promise<Result<T, DatabaseError>> {
  const logger = getLogger();
  
  try {
    const { data, error } = await client
      .from(SOME_TABLE)
      .select() // or .insert(), .update(), .delete()
      .eq('id', params.id)
      .throwOnError()
      .single();

    if (error) {
      logger.error('Database operation failed', { error, params });
      return failure(new DatabaseError('User-friendly error message'));
    }

    logger.info('Database operation successful', { data });
    return success(data);
  } catch (error) {
    logger.error('Something went wrong while [action]', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      params
    });
    return failure(new DatabaseError('Something went wrong while [action]'));
  }
}
```

## Type Safety Standards

### Database Types
- Always import: `import type { Database } from '~/database.types'`
- Use: `type Client = SupabaseClient<Database>`
- Use database types: `Database['public']['Tables']['table_name']['Insert' | 'Row' | 'Update']`

### Type Definitions
- **Location**: `src/lib/{module}/types/*.ts`
- Use PascalCase for types: `CreateClassParams`, `UpdateClassData`
- Extend database types when needed

## Error Handling Standards

### Result Pattern
- Use `Result<T, E>` for all operations
- Use `success(data)` and `failure(error)` helpers
- Follow success/failure pattern consistently

### Logging Standards
- **Always use logger from `~/core/logger`**
- **Never use console.log, console.error, etc.**

```typescript
import getLogger from '~/core/logger';

const logger = getLogger();

// Log with context
logger.error('Error message', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  name: error instanceof Error ? error.name : undefined,
  // Add relevant context like user ID, params, etc.
});

logger.info('Operation successful', { data, userId });
```

## File Organization

### Module Structure
```
src/lib/{module}/
├── server-actions-v2.ts    # Orchestration layer (preferred)
├── server-actions.ts       # Legacy orchestration layer
├── services/               # Business logic
│   └── module.service.ts
├── database/              # Data access
│   ├── mutations-v2.ts    # Preferred mutations
│   ├── mutations.ts       # Legacy mutations
│   └── queries.ts
├── types/                 # Type definitions
│   └── module-v2.ts
├── hooks/                 # React hooks (if needed)
└── constants/             # Module constants
```

### API Routes Structure
```
src/app/api/
├── public/               # Public endpoints (no auth required)
│   └── module/
│       └── route.ts
└── module/              # Authenticated endpoints
    └── route.ts
```

## General Guidelines

### File Naming
- Use kebab-case: `server-actions-v2.ts`, `mutations-v2.ts`
- Prefer `-v2` naming when available, fallback to legacy naming
- Component naming: PascalCase (e.g., `TutorEditDialog`)

### Component Naming
Name React components using the pattern: `[Domain][Action][Type]`
Examples:
- `TutorEditDialog`
- `TutorViewDialog`
- `ClassListTable`
- `SessionDetailsCard`

## Frontend Guidelines

- Always prefer server components.
- Always use server actions to fetch data in server components; never call queries or mutations directly in components.
- Keep components small and reusable.

### Use Workspace Dependencies
Always use workspace dependencies over standard library alternatives:
- For date manipulation: utilities from `~/lib/utils/` folder
- For lodash-like utilities: `~/lib/utils/` folder utilities
- For UI components: use components from `../base-v2/ui/` directory
- For notifications: use `sonner` (`toast`)
- For icons: use `lucide-react`

### Barrel Files for External Dependencies
Never import external dependencies directly in feature code.
Always use barrel files in the `~/lib/utils/` folder.

```typescript
// In ~/lib/utils/date-utils.ts
import { format, differenceInYears } from 'date-fns';
export { format, differenceInYears };

// In your feature code
import { format } from '~/lib/utils/date-utils';
```

### Database Table Names
Never hardcode database table names.
Always import table names from `~/lib/db-tables.ts`:

```typescript
import { USERS_TABLE, CLASSES_TABLE } from '~/lib/db-tables';
```

### Import Organization
Standard import order:
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

## Development Workflows

### Supabase Integration
- All database types are in `database.types.ts`
- Use strongly-typed Supabase client: `SupabaseClient<Database>`
- Access client via `getSupabaseServerActionClient()` for server actions
- Access client via `getSupabaseRouteHandlerClient()` for API routes

### Authentication Flows
- User session management via `useUserSession` hook
- Role-based access control via `useUserRole` hook

### Component Patterns
- Use controlled components for forms
- Validate forms using workspace logic
- Use `BaseDialog` for modals with `open`, `onClose` props
- Reset form state on dialog close
- Use memoization (`useMemo`) for filtered and paginated data
- Use workspace pagination hooks

### Error Handling in Components
- Use `toast.error` for user-facing errors
- Always log errors using the logger (never console functions)

### Code Quality Standards
When creating action plans, ensure:
- **Complete function/class implementations**
- **Proper TypeScript types**
- **Error handling patterns using logger**
- **Consistent naming conventions**
- **Follow existing architecture patterns**

## Communication Guidelines

### Be Specific
- **Use exact file paths**
- **Include line numbers when referencing existing code**
- **Provide complete code blocks, not snippets**

### Be Transparent
- **Explain the impact of changes**
- **Mention any dependencies or prerequisites**
- **Highlight any breaking changes**

### Be Helpful
- **Suggest improvements beyond the immediate request**
- **Point out potential issues or optimizations**
- **Offer alternative solutions when appropriate**

## Testing Standards

- Keep testing guidelines general
- Test each layer independently
- Mock dependencies appropriately
- Use Result pattern in tests
- Test both success and failure scenarios

## Documentation Standards

- Add JSDoc for public functions and complex logic
- Document "why" not "what"
- Use TODO comments for future improvements
- Reference workspace types and utilities in comments
- Never include obvious comments like "This function does X".

## Best Practices

1. **Single Responsibility**: Each function/class has one clear purpose
2. **Type Safety**: Use TypeScript types throughout
3. **Error Handling**: Always handle errors gracefully with logger
4. **Logging**: Use logger from `~/core/logger` with context
5. **Consistency**: Follow established patterns
6. **Security**: Validate inputs and handle sensitive data
7. **Maintainability**: Write code for future developers
8. **Service Isolation**: Never call services directly from components/pages
9. **Proper Routing**: Use server actions for mutations, API routes for queries
10. **File Naming**: Prefer `-v2` naming when available, maintain flexibility
