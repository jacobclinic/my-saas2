/**
 * Utility functions for input filtering and validation
 */

// Input filter functions
export const filterNameInput = (value: string): string => {
  // Only allow letters and spaces for names
  return value.replace(/[^a-zA-Z\s]/g, '');
};

export const filterPhoneInput = (value: string): string => {
  // Only allow digits for phone numbers
  return value.replace(/[^0-9]/g, '');
};

export const filterEmailInput = (value: string): string => {
  // Allow standard email characters
  return value.replace(/[^a-zA-Z0-9@._-]/g, '');
};

// Common input event handler
export const createFilteredInputHandler = (
  filterFn: (value: string) => string,
  onChange: (value: string) => void,
) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredValue = filterFn(e.target.value);
    onChange(filteredValue);
  };
};
