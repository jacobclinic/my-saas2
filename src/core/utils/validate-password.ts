interface PasswordValidationResult {
    isValid: boolean;
    message?: string;
    requirements?: string[];
  }
  
  export function validatePassword(password: string): PasswordValidationResult {
    const minLength = 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
  
    const missingRequirements: string[] = [];
  
    if (password.length < minLength) {
      missingRequirements.push(`At least ${minLength} characters`);
    }
  
    if (!hasLowerCase) {
      missingRequirements.push('At least one lowercase letter (a-z)');
    }
  
    if (!hasUpperCase) {
      missingRequirements.push('At least one uppercase letter (A-Z)');
    }
  
    if (!hasDigit) {
      missingRequirements.push('At least one digit (0-9)');
    }
  
    if (missingRequirements.length > 0) {
      return {
        isValid: false,
        message: `${missingRequirements.join(', ')}`,
        requirements: missingRequirements,
      };
    }
  
    return { isValid: true };
  }
  
  // Legacy function for backward compatibility - returns string error or true
  export function validatePasswordLegacy(password: string): string | true {
    const result = validatePassword(password);
  
    if (!result.isValid) {
      return `Password must meet the following requirements:\n• ${result.requirements?.join('\n• ')}`;
    }
  
    return true;
  }
  