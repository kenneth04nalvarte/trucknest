export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export interface PasswordValidationRule {
  pattern: RegExp;
  message: string;
  score: number;
}

const PASSWORD_RULES: PasswordValidationRule[] = [
  {
    pattern: /.{8,}/,
    message: 'Password must be at least 8 characters long',
    score: 1
  },
  {
    pattern: /[A-Z]/,
    message: 'Password must contain at least one uppercase letter',
    score: 1
  },
  {
    pattern: /[a-z]/,
    message: 'Password must contain at least one lowercase letter',
    score: 1
  },
  {
    pattern: /[0-9]/,
    message: 'Password must contain at least one number',
    score: 1
  },
  {
    pattern: /[^A-Za-z0-9]/,
    message: 'Password must contain at least one special character',
    score: 2
  }
];

export const validatePassword = (password: string): PasswordValidationResult => {
  const result: PasswordValidationResult = {
    isValid: true,
    errors: [],
    strength: 'weak',
    score: 0
  };

  for (const rule of PASSWORD_RULES) {
    if (!rule.pattern.test(password)) {
      result.isValid = false;
      result.errors.push(rule.message);
    } else {
      result.score += rule.score;
    }
  }

  if (result.score >= 5) {
    result.strength = 'strong';
  } else if (result.score >= 3) {
    result.strength = 'medium';
  }

  return result;
};

export const getPasswordStrengthColor = (strength: PasswordValidationResult['strength']): string => {
  switch (strength) {
    case 'strong':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'weak':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getPasswordStrengthMessage = (strength: PasswordValidationResult['strength']): string => {
  switch (strength) {
    case 'strong':
      return 'Strong password';
    case 'medium':
      return 'Medium strength password';
    case 'weak':
      return 'Weak password';
    default:
      return 'Password strength unknown';
  }
};

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