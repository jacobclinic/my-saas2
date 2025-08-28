/**
 * Text formatting utilities for common text transformations
 */

/**
 * Capitalizes the first letter of each word in a string
 * Useful for formatting day names, titles, etc.
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';

  return text.replace(
    /\b\w+\b/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
};

/**
 * Capitalizes the first letter of each day name in a schedule string
 * Handles multiple days separated by various delimiters
 */
export const capitalizeDayNames = (schedule: string): string => {
  if (!schedule) return '';

  // Handle common day abbreviations and full names
  return schedule.replace(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/gi,
    (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase(),
  );
};

/**
 * Capitalizes the first letter of a string
 */
export const capitalizeFirst = (text: string): string => {
  if (!text) return '';

  return text.charAt(0).toUpperCase() + text.slice(1);
};
