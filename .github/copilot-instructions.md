# Copilot Instructions for Comma-Edu Workspace

## Architecture Overview

- **Next.js App Router Architecture**: This project uses Next.js App Router with nested layouts:
  - `(site)`: Public-facing website pages
  - `(app)`: Protected application pages requiring authentication
  - `auth`: Authentication-related pages

- **Role-Based Access Control**:
  - Components use the `RoleControlledComponent` wrapper or `userRole` context to control visibility
  - Role types: `admin`, `tutor`, `student`
  - Navigation items are filtered based on user roles in `AppSidebarNavigation.tsx`

- **Database Integration**:
  - Uses Supabase with strongly-typed models defined in `src/database.types.ts`
  - Database mutations in `<module>/database/mutations.ts`
  - Database queries in `<module>/database/queries.ts`

- **External Services**:
  - Zoom integration for video sessions, using the server-side client in `src/lib/zoom/v2/client.ts`
  - Stripe for payments

## General Guidelines

- **General Rules**:
  - Always ask followup questions if something is confusing to you
  - Never assume anything without strong reasoning

- **Use Workspace Dependencies**:  
  Always use workspace dependencies over standard library alternatives:  
  - For date manipulation: `date-fns` via barrel files (e.g., `src/lib/utils/date-utils.ts`)
  - For lodash-like utilities: `src/lib/utils/lodash-utils.ts` 
  - For UI components: use components from `../base-v2/ui/` directory
  - For notifications: use `sonner` (`toast`)
  - For icons: use `lucide-react`

- **Barrel Files for External Dependencies**:  
  Never import external dependencies (like `date-fns`, `lodash`, etc.) directly in feature code.  
  Always use barrel files in the utilities folder (e.g., `src/lib/utils/date-utils.ts`, `src/lib/utils/lodash-utils.ts`).
  Example:
  ```typescript
  // In src/lib/utils/lodash-utils.ts
  import debounce from 'lodash/debounce';
  import isEqual from 'lodash/isEqual';
  export { debounce, isEqual };
  
  // In your feature code
  import { debounce } from '~/lib/utils/lodash-utils';
  ```
  This allows easy switching of dependencies in the future.

- **Database Table Names**:  
  Never hardcode database table names.  
  Always import table names from `src/lib/db-tables.ts`:
  ```typescript
  import { USERS_TABLE, CLASSES_TABLE } from '~/lib/db-tables';
  ```

- **Component Naming:**  
  Name React components using the pattern:  
  `[Domain][Action][Type]`  
  Examples:  
  - `TutorEditDialog`
  - `TutorViewDialog`
  - `ClassListTable`
  - `SessionDetailsCard`

- **Code Reusability:**  
  - Before implementing new logic, always check if a similar implementation exists in the codebase.
  - If similar logic exists, extract it to a common utility/hook/component and reuse.
  - Prefer composable components and avoid duplication.
  - Use helper functions for badge variants, status checks, and formatting.
  - Keep components small and focused on a single responsibility.
  

- **TypeScript Usage:**  
  - Always type props and state.
  - Extend workspace types (e.g., `UserType`, `ClassType`) for additional fields.
  - Use union types for status, roles, etc.

- **Form Handling:**  
  - Use controlled components for forms.
  - Validate forms using workspace logic (see `isFormValid` in form components).
  - For age validation, use a reusable function with `date-fns` via the barrel file.

- **Data Table Patterns:**  
  - Use memoization (`useMemo`) for filtered and paginated data.
  - Use workspace pagination hooks (`useTablePagination`).
  - Map data to table format using helper functions.

- **Dialog/Modal Patterns:**  
  - Use `BaseDialog` for modals.
  - Pass `open`, `onClose`, and relevant data as props.
  - Reset form state on close.

- **Search and Filter:**  
  - Implement search and filter using lowercased string matching.
  - Support searching by multiple fields (name, email, phone, subjects, status).

- **Badge and Status:**  
  - Use a helper function for badge variants based on status.
  - Display status using workspace `Badge` component.

- **Error Handling:**  
  - Use `toast.error` for user-facing errors.
  - Log errors to console for debugging.

- **Documentation:**  
  - Add JSDoc comments for exported functions and components unless they are self-explanatory.
  - Never auto add obvious comments to the functions.
  - Reference workspace types and utilities in comments.

## Dependency Usage

- Use only the dependencies listed in `package.json` and prefer workspace wrappers/barrel files for third-party libraries.
- If you know something, always ask from the user for permission before installing the dependency.
- For utility functions (e.g., debounce, throttle, deep clone), use the workspace utility barrel file instead of direct imports.

## Example Patterns

### Barrel File for date-fns

````typescript
// filepath: src/utils/date.ts
export { format, differenceInYears, parseISO } from 'date-fns';
```

## Development Workflows

- **Supabase Integration**:
  - All database types are in `database.types.ts`
  - Use strongly-typed Supabase client: `SupabaseClient<Database>`
  - Access client via `getSupabaseServerActionClient()` for server actions

- **Authentication Flows**:
  - User session management via `useUserSession` hook
  - Role-based access control via `useUserRole` hook

- **Zoom Integration**:
  - Use `ZoomService` class from `src/lib/zoom/v2/zoom.service.ts`
  - Schedule meetings using `createZoomUserMeeting` method

- **Component Organization**:
  - Component files are organized by domain in `src/app/(app)/components/`
  - Shared UI components are in `src/app/(app)/components/base-v2/ui/`