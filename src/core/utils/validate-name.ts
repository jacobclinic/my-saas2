interface NameValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateName(name: string): NameValidationResult {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return {
      isValid: false,
      message: 'Name is required',
    };
  }

  if (trimmedName.length < 3) {
    return {
      isValid: false,
      message: 'Name must be at least 3 characters',
    };
  }

  // Only allow letters and spaces
  if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
    return {
      isValid: false,
      message: 'Name should only contain letters',
    };
  }

  return { isValid: true };
}

// Legacy function for react-hook-form validation - returns string error or true
export function validateNameForForm(name: string): string | true {
  const result = validateName(name);

  if (!result.isValid) {
    return result.message!;
  }

  return true;
}
