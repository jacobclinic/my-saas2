interface PhoneValidationResult {
  isValid: boolean;
  message?: string;
}

export function validatePhoneNumber(phone: string): PhoneValidationResult {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return {
      isValid: false,
      message: 'Phone number is required',
    };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = trimmedPhone.replace(/[^0-9]/g, '');

  if (digitsOnly.length !== 10) {
    return {
      isValid: false,
      message: 'Phone number must be exactly 10 digits',
    };
  }

  if (!digitsOnly.startsWith('0')) {
    return {
      isValid: false,
      message: 'Phone number must start with 0',
    };
  }

  return { isValid: true };
}

// Legacy function for react-hook-form validation - returns string error or true
export function validatePhoneNumberForForm(phone: string): string | true {
  const result = validatePhoneNumber(phone);

  if (!result.isValid) {
    return result.message!;
  }

  return true;
}
