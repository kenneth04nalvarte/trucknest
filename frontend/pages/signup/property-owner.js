import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import styles from '../../styles/SignupForms.module.css';
import {
  isValidPhone,
  isValidZip,
  isValidBankAccount,
  isValidRoutingNumber,
  isValidPrice,
  ERROR_MESSAGES
} from '../../utils/validation';

export default function PropertyOwnerSignup() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    businessName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    taxId: '',
    
    // Property Details
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZipCode: '',
    spaceAvailable: '',
    surfaceType: '',
    amenities: {
      lighting: false,
      security: false,
      cameras: false,
      fencing: false,
      restrooms: false,
      waterSupply: false
    },
    
    // Pricing
    hourlyRate: '',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    
    // Banking
    accountHolder: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    
    // Add coordinates for both addresses
    businessCoordinates: {
      lat: 0,
      lng: 0
    },
    propertyCoordinates: {
      lat: 0,
      lng: 0
    }
  });

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch(stepNumber) {
      case 1:
        if (!formData.businessName) newErrors.businessName = ERROR_MESSAGES.required;
        if (!formData.phoneNumber) newErrors.phoneNumber = ERROR_MESSAGES.required;
        else if (!isValidPhone(formData.phoneNumber)) newErrors.phoneNumber = ERROR_MESSAGES.phone;
        if (!formData.address) newErrors.address = ERROR_MESSAGES.required;
        if (!formData.city) newErrors.city = ERROR_MESSAGES.required;
        if (!formData.state) newErrors.state = ERROR_MESSAGES.required;
        if (!formData.zipCode) newErrors.zipCode = ERROR_MESSAGES.required;
        else if (!isValidZip(formData.zipCode)) newErrors.zipCode = ERROR_MESSAGES.zip;
        break;

      case 2:
        if (!formData.propertyAddress) newErrors.propertyAddress = ERROR_MESSAGES.required;
        if (!formData.propertyCity) newErrors.propertyCity = ERROR_MESSAGES.required;
        if (!formData.propertyState) newErrors.propertyState = ERROR_MESSAGES.required;
        if (!formData.propertyZipCode) newErrors.propertyZipCode = ERROR_MESSAGES.required;
        else if (!isValidZip(formData.propertyZipCode)) newErrors.propertyZipCode = ERROR_MESSAGES.zip;
        if (!formData.spaceAvailable) newErrors.spaceAvailable = ERROR_MESSAGES.required;
        if (!formData.surfaceType) newErrors.surfaceType = ERROR_MESSAGES.required;
        break;

      case 3:
        if (!formData.hourlyRate) newErrors.hourlyRate = ERROR_MESSAGES.required;
        else if (!isValidPrice(formData.hourlyRate)) newErrors.hourlyRate = ERROR_MESSAGES.price;
        if (!formData.dailyRate) newErrors.dailyRate = ERROR_MESSAGES.required;
        else if (!isValidPrice(formData.dailyRate)) newErrors.dailyRate = ERROR_MESSAGES.price;
        if (!formData.weeklyRate) newErrors.weeklyRate = ERROR_MESSAGES.required;
        else if (!isValidPrice(formData.weeklyRate)) newErrors.weeklyRate = ERROR_MESSAGES.price;
        if (!formData.monthlyRate) newErrors.monthlyRate = ERROR_MESSAGES.required;
        else if (!isValidPrice(formData.monthlyRate)) newErrors.monthlyRate = ERROR_MESSAGES.price;
        break;

      case 4:
        if (!formData.accountHolder) newErrors.accountHolder = ERROR_MESSAGES.required;
        if (!formData.accountNumber) newErrors.accountNumber = ERROR_MESSAGES.required;
        else if (!isValidBankAccount(formData.accountNumber)) newErrors.accountNumber = ERROR_MESSAGES.bankAccount;
        if (!formData.routingNumber) newErrors.routingNumber = ERROR_MESSAGES.required;
        else if (!isValidRoutingNumber(formData.routingNumber)) newErrors.routingNumber = ERROR_MESSAGES.routingNumber;
        if (!formData.bankName) newErrors.bankName = ERROR_MESSAGES.required;
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        amenities: {
          ...prev.amenities,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    }
  };

  const handleBusinessAddressSelect = (addressComponents) => {
    setFormData(prev => ({
      ...prev,
      address: `${addressComponents.streetNumber} ${addressComponents.streetName}`,
      city: addressComponents.city,
      state: addressComponents.state,
      zipCode: addressComponents.zipCode,
      businessCoordinates: {
        lat: addressComponents.lat,
        lng: addressComponents.lng
      }
    }));

    // Clear any existing errors
    setErrors(prev => ({
      ...prev,
      address: null,
      city: null,
      state: null,
      zipCode: null
    }));
  };

  const handlePropertyAddressSelect = (addressComponents) => {
    setFormData(prev => ({
      ...prev,
      propertyAddress: `${addressComponents.streetNumber} ${addressComponents.streetName}`,
      propertyCity: addressComponents.city,
      propertyState: addressComponents.state,
      propertyZipCode: addressComponents.zipCode,
      propertyCoordinates: {
        lat: addressComponents.lat,
        lng: addressComponents.lng
      }
    }));

    // Clear any existing errors
    setErrors(prev => ({
      ...prev,
      propertyAddress: null,
      propertyCity: null,
      propertyState: null,
      propertyZipCode: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            userId: user.uid,
            userData: {
              ...formData,
              email: user.email
            },
            role: 'property-owner'
          })
        });

        if (!response.ok) {
          throw new Error('Registration failed');
        }

        router.push('/dashboard/property-owner');
      } catch (error) {
        console.error('Error submitting form:', error);
        setErrors(prev => ({
          ...prev,
          submit: 'Failed to create profile. Please try again.'
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return <span className={styles.error}>{errors[fieldName]}</span>;
    }
    return null;
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className={styles.formSection}>
            <h2>Business Information</h2>
            <input
              type="text"
              name="businessName"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={handleInputChange}
              className={errors.businessName ? styles.errorInput : ''}
              required
            />
            {renderError('businessName')}
            
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={errors.phoneNumber ? styles.errorInput : ''}
              required
            />
            {renderError('phoneNumber')}
            
            <AddressAutocomplete
              value={formData.address}
              onChange={(e) => handleInputChange({ target: { name: 'address', value: e.target.value } })}
              onSelect={handleBusinessAddressSelect}
              placeholder="Enter business address"
              required
              error={!!errors.address}
              className={styles.addressInput}
            />
            {renderError('address')}
            
            <div className={styles.row}>
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                className={errors.city ? styles.errorInput : ''}
                required
                readOnly
              />
              {renderError('city')}
              
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleInputChange}
                className={errors.state ? styles.errorInput : ''}
                required
                readOnly
              />
              {renderError('state')}
              
              <input
                type="text"
                name="zipCode"
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChange={handleInputChange}
                className={errors.zipCode ? styles.errorInput : ''}
                required
                readOnly
              />
              {renderError('zipCode')}
            </div>
            
            <input
              type="text"
              name="taxId"
              placeholder="Tax ID (Optional)"
              value={formData.taxId}
              onChange={handleInputChange}
            />
          </div>
        );
      
      case 2:
        return (
          <div className={styles.formSection}>
            <h2>Property Details</h2>
            <AddressAutocomplete
              value={formData.propertyAddress}
              onChange={(e) => handleInputChange({ target: { name: 'propertyAddress', value: e.target.value } })}
              onSelect={handlePropertyAddressSelect}
              placeholder="Enter property address"
              required
              error={!!errors.propertyAddress}
              className={styles.addressInput}
            />
            {renderError('propertyAddress')}
            
            <div className={styles.row}>
              <input
                type="text"
                name="propertyCity"
                placeholder="City"
                value={formData.propertyCity}
                onChange={handleInputChange}
                className={errors.propertyCity ? styles.errorInput : ''}
                required
                readOnly
              />
              {renderError('propertyCity')}
              
              <input
                type="text"
                name="propertyState"
                placeholder="State"
                value={formData.propertyState}
                onChange={handleInputChange}
                className={errors.propertyState ? styles.errorInput : ''}
                required
                readOnly
              />
              {renderError('propertyState')}
              
              <input
                type="text"
                name="propertyZipCode"
                placeholder="ZIP Code"
                value={formData.propertyZipCode}
                onChange={handleInputChange}
                className={errors.propertyZipCode ? styles.errorInput : ''}
                required
                readOnly
              />
              {renderError('propertyZipCode')}
            </div>
            
            <input
              type="number"
              name="spaceAvailable"
              placeholder="Available Space (sq ft)"
              value={formData.spaceAvailable}
              onChange={handleInputChange}
              className={errors.spaceAvailable ? styles.errorInput : ''}
              required
            />
            {renderError('spaceAvailable')}
            
            <select
              name="surfaceType"
              value={formData.surfaceType}
              onChange={handleInputChange}
              className={errors.surfaceType ? styles.errorInput : ''}
              required
            >
              <option value="">Select Surface Type</option>
              <option value="concrete">Concrete</option>
              <option value="asphalt">Asphalt</option>
              <option value="gravel">Gravel</option>
              <option value="dirt">Dirt</option>
            </select>
            {renderError('surfaceType')}
            
            <div className={styles.amenities}>
              <h3>Amenities</h3>
              <div className={styles.checkboxGroup}>
                {Object.keys(formData.amenities).map(amenity => (
                  <label key={amenity}>
                    <input
                      type="checkbox"
                      name={amenity}
                      checked={formData.amenities[amenity]}
                      onChange={handleInputChange}
                    />
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className={styles.formSection}>
            <h2>Pricing</h2>
            <div className={styles.row}>
              <input
                type="number"
                name="hourlyRate"
                placeholder="Hourly Rate ($)"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                className={errors.hourlyRate ? styles.errorInput : ''}
                required
              />
              {renderError('hourlyRate')}
              <input
                type="number"
                name="dailyRate"
                placeholder="Daily Rate ($)"
                value={formData.dailyRate}
                onChange={handleInputChange}
                className={errors.dailyRate ? styles.errorInput : ''}
                required
              />
              {renderError('dailyRate')}
            </div>
            <div className={styles.row}>
              <input
                type="number"
                name="weeklyRate"
                placeholder="Weekly Rate ($)"
                value={formData.weeklyRate}
                onChange={handleInputChange}
                className={errors.weeklyRate ? styles.errorInput : ''}
                required
              />
              {renderError('weeklyRate')}
              <input
                type="number"
                name="monthlyRate"
                placeholder="Monthly Rate ($)"
                value={formData.monthlyRate}
                onChange={handleInputChange}
                className={errors.monthlyRate ? styles.errorInput : ''}
                required
              />
              {renderError('monthlyRate')}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className={styles.formSection}>
            <h2>Banking Information</h2>
            <input
              type="text"
              name="accountHolder"
              placeholder="Account Holder Name"
              value={formData.accountHolder}
              onChange={handleInputChange}
              className={errors.accountHolder ? styles.errorInput : ''}
              required
            />
            {renderError('accountHolder')}
            
            <input
              type="text"
              name="accountNumber"
              placeholder="Account Number"
              value={formData.accountNumber}
              onChange={handleInputChange}
              className={errors.accountNumber ? styles.errorInput : ''}
              required
            />
            {renderError('accountNumber')}
            
            <input
              type="text"
              name="routingNumber"
              placeholder="Routing Number"
              value={formData.routingNumber}
              onChange={handleInputChange}
              className={errors.routingNumber ? styles.errorInput : ''}
              required
            />
            {renderError('routingNumber')}
            
            <input
              type="text"
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleInputChange}
              className={errors.bankName ? styles.errorInput : ''}
              required
            />
            {renderError('bankName')}
          </div>
        );
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {renderStep()}
        
        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
          </div>
        )}
        
        <div className={styles.buttons}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className={styles.backButton}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
          <button 
            type="submit" 
            className={styles.nextButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : step === 4 ? 'Submit' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
} 