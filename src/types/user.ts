import { User, UserMetadata } from 'firebase/auth';

export type UserRole = 'trucker' | 'landowner' | 'admin';

export type VerificationStatus = 'verified' | 'pending' | 'unverified';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formatted?: string;
}

export interface Location {
  lat: number;
  lng: number;
  formatted?: string;
}

export interface BusinessInfo {
  name: string;
  type: string;
  taxId: string;
  verificationStatus: VerificationStatus;
  registrationDate?: Date;
  lastVerified?: Date;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  timezone: string;
  currency: string;
}

export interface CustomUser extends Omit<User, 'phoneNumber' | 'metadata'> {
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  businessInfo?: BusinessInfo;
  address?: Address;
  location?: Location;
  preferences?: UserPreferences;
  metadata: UserMetadata & {
    lastLogin?: Date;
    loginCount?: number;
    lastActive?: Date;
    accountStatus?: 'active' | 'suspended' | 'deactivated';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  businessInfo?: Partial<BusinessInfo>;
  address?: Partial<Address>;
  location?: Partial<Location>;
  preferences?: Partial<UserPreferences>;
}

export interface UserCreateData extends Omit<CustomUser, 'uid' | 'email' | 'emailVerified' | 'metadata' | 'createdAt' | 'updatedAt'> {
  email: string;
  password: string;
  confirmPassword: string;
} 