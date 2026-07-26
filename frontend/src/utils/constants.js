export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const STORAGE_KEYS = {
  TOKEN: 'medisphere_token',
  USER: 'medisphere_user',
};

export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
};
