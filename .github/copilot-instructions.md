# Copilot Instructions for Comma-Edu Workspace

## General Guidelines

- **General Rules**
- Always ask followup questions if something is confusing to you.
- Never assume anything without strong reseaoning.
- For file naming, use the kebab naming convention (e.g., `short-links-service.ts`).
- For componet naming, use PascalCase (e.g., `TutorEditDialog`).
- Always use TypeScript for all code files.
- All the database mutations should be done through a mutations.ts file. Usually there are multiple mutations in a single file and multiple mutations files. Usually a file named `mutations.ts` is used for all the mutations related to a single table. There is a folder in `src/lib/` for each table, e.g., `src/lib/short-links/database/mutations.ts` for short links table mutations.
- All the database queries should be done through a queries.ts file. Usually there are multiple queries in a single file and multiple queries files. Usually a file named `queries.ts` is used for all the queries related to a single table. There is a folder in `src/lib/` for each table, e.g., `src/lib/short-links/database/queries.ts` for short links table queries.
- Always use `import` statements for importing modules.
- Always use `export` statements for exporting modules.
- Always use `const` for variables that are not reassigned.
- Always use `async/await` for asynchronous operations.

- **Use Workspace Dependencies:**  
  Always use workspace dependencies over standard library alternatives.  
  - For date manipulation and formatting, use `date-fns` via a barrel file in the utilities folder (e.g., `src/utils/date.ts`).  
  - For lodash-like utilities, use a barrel file (e.g., `src/utils/lodash.ts`) and never import directly from `lodash`.
  - For UI components, use those from `../base-v2/ui/` directorty.
  - For notifications, use `sonner` (`toast`).
  - For icons, use `lucide-react`.


- **Barrel Files for External Dependencies:**  
  Never import external dependencies (like `date-fns`, `lodash`, etc.) directly in feature code.  
  Always create and use barrel files in the utilities folder to wrap and export only the needed functions.  
  This allows easy switching of dependencies in the future.

- **Database Table Names:**  
  Never hardcode database table names.  
  Always import table names from `src/lib/db-tables.ts`.

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
  - Validate forms using workspace logic (see `isFormValid` in [`TutorEdit.tsx`](src/app/(app)/components/tutors/TutorEdit.tsx)).
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