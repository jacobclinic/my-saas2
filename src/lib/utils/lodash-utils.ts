import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

/**
 * This file acts as a facade for lodash functions.
 * Instead of importing from 'lodash' directly in your components/files,
 * you should import them from this file.
 *
 * This makes it easy to:
 * 1. Swap out lodash for another library in the future.
 * 2. Apply custom modifications to the functions.
 * 3. Tree-shake unused lodash functions more effectively.
 * 4. Have a single source of truth for all third-party utility functions.
 */

export { debounce, isEqual };