export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  pattern: RegExp;
  message: string;
  required?: boolean;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationFormData {
  [key: string]: string | number;
}

export interface Dimensions {
  length: number;
  height: number;
  weight: number;
}

export const VALIDATION_RULES: ValidationRules = {
  phone: [
    {
      pattern: /^\+?[1-9]\d{1,14}$/,
      message: 'Please enter a valid phone number',
      required: true
    }
  ],
  email: [
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
      required: true
    }
  ],
  zip: [
    {
      pattern: /^\d{5}(-\d{4})?$/,
      message: 'Please enter a valid ZIP code',
      required: true
    }
  ],
  creditCard: [
    {
      pattern: /^\d{16}$/,
      message: 'Please enter a valid credit card number',
      required: true
    }
  ],
  expiryDate: [
    {
      pattern: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
      message: 'Please enter a valid expiry date (MM/YY)',
      required: true
    }
  ],
  cvv: [
    {
      pattern: /^\d{3,4}$/,
      message: 'Please enter a valid CVV',
      required: true
    }
  ],
  bankAccount: [
    {
      pattern: /^\d{8,17}$/,
      message: 'Please enter a valid bank account number',
      required: true
    }
  ],
  routingNumber: [
    {
      pattern: /^\d{9}$/,
      message: 'Please enter a valid routing number',
      required: true
    }
  ],
  licensePlate: [
    {
      pattern: /^[A-Z0-9]{1,8}$/,
      message: 'Please enter a valid license plate number',
      required: true
    }
  ],
  price: [
    {
      pattern: /^\d+(\.\d{1,2})?$/,
      message: 'Please enter a valid price',
      required: true
    }
  ]
};

export const validateField = (
  value: string | number,
  rules: ValidationRule[]
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: []
  };

  for (const rule of rules) {
    if (rule.required && !value) {
      result.isValid = false;
      result.errors.push(rule.message);
      break;
    }

    if (value && !rule.pattern.test(String(value))) {
      result.isValid = false;
      result.errors.push(rule.message);
      break;
    }
  }

  return result;
};

export const validateDimensions = (dimensions: Dimensions): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: []
  };

  if (dimensions.length <= 0) {
    result.isValid = false;
    result.errors.push('Length must be greater than 0');
  }

  if (dimensions.height <= 0) {
    result.isValid = false;
    result.errors.push('Height must be greater than 0');
  }

  if (dimensions.weight <= 0) {
    result.isValid = false;
    result.errors.push('Weight must be greater than 0');
  }

  return result;
};

export const validateForm = (
  formData: ValidationFormData,
  fieldRules: ValidationRules
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: []
  };

  for (const [field, value] of Object.entries(formData)) {
    const rules = fieldRules[field];
    if (rules) {
      const fieldResult = validateField(value, rules);
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors.push(...fieldResult.errors);
      }
    }
  }

  return result;
};

export const ERROR_MESSAGES = {
  required: 'This field is required',
  phone: 'Please enter a valid phone number',
  email: 'Please enter a valid email address',
  zip: 'Please enter a valid ZIP code',
  creditCard: 'Please enter a valid credit card number',
  expiryDate: 'Please enter a valid expiry date (MM/YY)',
  cvv: 'Please enter a valid CVV',
  bankAccount: 'Please enter a valid bank account number',
  routingNumber: 'Please enter a valid routing number',
  dimensions: 'Please enter valid dimensions',
  licensePlate: 'Please enter a valid license plate number',
  price: 'Please enter a valid price'
} as const; 