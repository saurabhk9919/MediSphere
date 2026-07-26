import api from './api';

export const getPatientVitals = async () => {
  const response = await api.get('/vitals/my');
  return response.data;
};
