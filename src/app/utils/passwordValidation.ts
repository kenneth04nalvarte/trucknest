export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  
  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Calculate password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  
  if (password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength = 'strong'
  } else if (password.length >= 8 &&
             /[A-Za-z]/.test(password) &&
             /\d/.test(password)) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'bg-green-500'
    case 'medium':
      return 'bg-yellow-500'
    default:
      return 'bg-red-500'
  }
}

export function getPasswordStrengthWidth(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'w-full'
    case 'medium':
      return 'w-2/3'
    default:
      return 'w-1/3'
  }
} 