import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import styles from '../../styles/SignupForms.module.css';
import {
  isValidPhone,
  isValidZip,
  isValidLicensePlate,
  isValidDimensions,
  ERROR_MESSAGES
} from '../../utils/validation';

export default function TruckerSignup() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    companyName: '',
    
    // Vehicle Information
    vehicleType: '',
    vehicleLength: '',
    vehicleWidth: '',
    vehicleHeight: '',
    licensePlate: '',
    registrationNumber: '',
    
    // Documents
    driversLicense: '',
    commercialLicense: '',
    insuranceProvider: '',
    insurancePolicy: '',
    
    // Payment Information
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingZip: '',
    
    // Commercial Information
    isCommercial: false,
    dotNumber: '',
    mcNumber: '',
    
    // Address
    coordinates: {
      lat: 0,
      lng: 0
    }
  });

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch(stepNumber) {
      case 1:
        if (!formData.firstName) newErrors.firstName = ERROR_MESSAGES.required;
        if (!formData.lastName) newErrors.lastName = ERROR_MESSAGES.required;
        if (!formData.phoneNumber) newErrors.phoneNumber = ERROR_MESSAGES.required;
        else if (!isValidPhone(formData.phoneNumber)) newErrors.phoneNumber = ERROR_MESSAGES.phone;
        if (!formData.address) newErrors.address = ERROR_MESSAGES.required;
        if (!formData.city) newErrors.city = ERROR_MESSAGES.required;
        if (!formData.state) newErrors.state = ERROR_MESSAGES.required;
        if (!formData.zipCode) newErrors.zipCode = ERROR_MESSAGES.required;
        else if (!isValidZip(formData.zipCode)) newErrors.zipCode = ERROR_MESSAGES.zip;
        break;

      case 2:
        if (!formData.vehicleType) newErrors.vehicleType = ERROR_MESSAGES.required;
        if (!formData.licensePlate) newErrors.licensePlate = ERROR_MESSAGES.required;
        else if (!isValidLicensePlate(formData.licensePlate)) newErrors.licensePlate = ERROR_MESSAGES.licensePlate;
        if (!formData.vehicleLength) newErrors.vehicleLength = ERROR_MESSAGES.required;
        else if (!isValidDimensions(formData.vehicleLength)) newErrors.vehicleLength = ERROR_MESSAGES.dimensions;
        if (!formData.vehicleWidth) newErrors.vehicleWidth = ERROR_MESSAGES.required;
        else if (!isValidDimensions(formData.vehicleWidth)) newErrors.vehicleWidth = ERROR_MESSAGES.dimensions;
        if (!formData.vehicleHeight) newErrors.vehicleHeight = ERROR_MESSAGES.required;
        else if (!isValidDimensions(formData.vehicleHeight)) newErrors.vehicleHeight = ERROR_MESSAGES.dimensions;
        break;

      case 3:
        if (!formData.companyName && formData.isCommercial) newErrors.companyName = ERROR_MESSAGES.required;
        if (!formData.dotNumber && formData.isCommercial) newErrors.dotNumber = ERROR_MESSAGES.required;
        if (!formData.mcNumber && formData.isCommercial) newErrors.mcNumber = ERROR_MESSAGES.required;
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
        [name]: checked
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

  const handleAddressSelect = (addressComponents) => {
    setFormData(prev => ({
      ...prev,
      address: `${addressComponents.streetNumber} ${addressComponents.streetName}`,
      city: addressComponents.city,
      state: addressComponents.state,
      zipCode: addressComponents.zipCode,
      coordinates: {
        lat: addressComponents.lat,
        lng: addressComponents.lng
      }
    }));

    setErrors(prev => ({
      ...prev,
      address: null,
      city: null,
      state: null,
      zipCode: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }

    if (step < 3) {
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
            role: 'trucker'
          })
        });

        if (!response.ok) {
          throw new Error('Registration failed');
        }

        router.push('/dashboard/trucker');
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/signin');
    return null;
  }

  return (
    <div className={styles.container}>
      <h1>Trucker Sign Up</h1>
      <div className={styles.progressBar}>
        <div 
          className={styles.progress}
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {step === 1 && (
          <div className={styles.formSection}>
            <h2>Personal Information</h2>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={errors.firstName ? styles.errorInput : ''}
                />
                {renderError('firstName')}
              </div>
              
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={errors.lastName ? styles.errorInput : ''}
                />
                {renderError('lastName')}
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={errors.phoneNumber ? styles.errorInput : ''}
              />
              {renderError('phoneNumber')}
            </div>
            
            <div className={styles.inputGroup}>
              <AddressAutocomplete
                value={formData.address}
                onChange={(e) => handleInputChange({ target: { name: 'address', value: e.target.value } })}
                onSelect={handleAddressSelect}
                placeholder="Enter your address"
                error={!!errors.address}
              />
              {renderError('address')}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.formSection}>
            <h2>Vehicle Information</h2>
            <div className={styles.inputGroup}>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                className={errors.vehicleType ? styles.errorInput : ''}
              >
                <option value="">Select Vehicle Type</option>
                <option value="semi">Semi-Truck</option>
                <option value="box">Box Truck</option>
                <option value="van">Van</option>
              </select>
              {renderError('vehicleType')}
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  name="vehicleLength"
                  placeholder="Length (ft)"
                  value={formData.vehicleLength}
                  onChange={handleInputChange}
                  className={errors.vehicleLength ? styles.errorInput : ''}
                />
                {renderError('vehicleLength')}
              </div>

              <div className={styles.inputGroup}>
                <input
                  type="text"
                  name="vehicleWidth"
                  placeholder="Width (ft)"
                  value={formData.vehicleWidth}
                  onChange={handleInputChange}
                  className={errors.vehicleWidth ? styles.errorInput : ''}
                />
                {renderError('vehicleWidth')}
              </div>

              <div className={styles.inputGroup}>
                <input
                  type="text"
                  name="vehicleHeight"
                  placeholder="Height (ft)"
                  value={formData.vehicleHeight}
                  onChange={handleInputChange}
                  className={errors.vehicleHeight ? styles.errorInput : ''}
                />
                {renderError('vehicleHeight')}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                name="licensePlate"
                placeholder="License Plate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                className={errors.licensePlate ? styles.errorInput : ''}
              />
              {renderError('licensePlate')}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.formSection}>
            <h2>Commercial Information</h2>
            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  name="isCommercial"
                  checked={formData.isCommercial}
                  onChange={handleInputChange}
                />
                This is a commercial vehicle
              </label>
            </div>

            {formData.isCommercial && (
              <>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Company Name"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={errors.companyName ? styles.errorInput : ''}
                  />
                  {renderError('companyName')}
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <input
                      type="text"
                      name="dotNumber"
                      placeholder="DOT Number"
                      value={formData.dotNumber}
                      onChange={handleInputChange}
                      className={errors.dotNumber ? styles.errorInput : ''}
                    />
                    {renderError('dotNumber')}
                  </div>

                  <div className={styles.inputGroup}>
                    <input
                      type="text"
                      name="mcNumber"
                      placeholder="MC Number"
                      value={formData.mcNumber}
                      onChange={handleInputChange}
                      className={errors.mcNumber ? styles.errorInput : ''}
                    />
                    {renderError('mcNumber')}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.buttonGroup}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className={styles.secondaryButton}
            >
              Back
            </button>
          )}
          
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSubmitting}
          >
            {step === 3 ? (isSubmitting ? 'Creating Account...' : 'Create Account') : 'Next'}
          </button>
        </div>

        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
          </div>
        )}
      </form>
    </div>
  );
} 