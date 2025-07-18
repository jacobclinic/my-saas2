interface BirthdayValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateBirthday(birthday: string): BirthdayValidationResult {
  if (!birthday.trim()) {
    return {
      isValid: false,
      message: 'Birthday is required',
    };
  }

  const today = new Date();
  const birthDate = new Date(birthday);
  
  // Check if the date is valid
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      message: 'Invalid date format',
    };
  }

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Check age range (13-100)
  if (age < 13) {
    return {
      isValid: false,
      message: 'You must be at least 13 years old',
    };
  }

  if (age > 100) {
    return {
      isValid: false,
      message: 'Please enter a valid birth date',
    };
  }

  // Check if the date is not in the future
  if (birthDate > today) {
    return {
      isValid: false,
      message: 'Birth date cannot be in the future',
    };
  }

  return { isValid: true };
}

// Helper function to get min and max dates for the date picker
export function getBirthdayDateLimits() {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  
  return {
    min: minDate.toISOString().split('T')[0],
    max: maxDate.toISOString().split('T')[0],
  };
}
