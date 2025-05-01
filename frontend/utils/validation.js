// Phone number validation (US format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

// ZIP code validation
export const isValidZip = (zip) => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Credit card validation (basic)
export const isValidCreditCard = (number) => {
  const ccRegex = /^[0-9]{16}$/;
  return ccRegex.test(number.replace(/\s/g, ''));
};

// Expiry date validation (MM/YY format)
export const isValidExpiryDate = (date) => {
  const expRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!expRegex.test(date)) return false;
  
  const [month, year] = date.split('/');
  const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
  const today = new Date();
  return expiry > today;
};

// CVV validation
export const isValidCVV = (cvv) => {
  const cvvRegex = /^[0-9]{3,4}$/;
  return cvvRegex.test(cvv);
};

// Bank account number validation (basic)
export const isValidBankAccount = (number) => {
  const accountRegex = /^\d{8,17}$/;
  return accountRegex.test(number);
};

// Routing number validation (US)
export const isValidRoutingNumber = (number) => {
  const routingRegex = /^\d{9}$/;
  return routingRegex.test(number);
};

// Vehicle dimensions validation
export const isValidDimensions = (length, width, height) => {
  return (
    length > 0 && length <= 100 && // Max length 100 feet
    width > 0 && width <= 20 && // Max width 20 feet
    height > 0 && height <= 20 // Max height 20 feet
  );
};

// License plate validation (basic)
export const isValidLicensePlate = (plate) => {
  const plateRegex = /^[A-Z0-9]{1,8}$/i;
  return plateRegex.test(plate);
};

// Pricing validation
export const isValidPrice = (price) => {
  return !isNaN(price) && parseFloat(price) >= 0;
};

// Error messages
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
}; 