interface EmailValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return {
      isValid: false,
      message: 'Email is required',
    };
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  return { isValid: true };
}

// Legacy function for react-hook-form validation - returns string error or true
export function validateEmailForForm(email: string): string | true {
  const result = validateEmail(email);

  if (!result.isValid) {
    return result.message!;
  }

  return true;
}
