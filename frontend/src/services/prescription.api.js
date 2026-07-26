import api from './api';

export const getPatientPrescriptions = async () => {
  const response = await api.get('/prescriptions/my');
  return response.data;
};
