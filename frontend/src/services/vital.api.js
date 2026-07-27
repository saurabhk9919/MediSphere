import api from './api';

export const getPatientVitals = async () => {
  const response = await api.get('/vitals/my');
  return response.data;
};

export const getPatientVitalsForDoctor = async (patientId) => {
  const response = await api.get(`/vitals/patient/${patientId}`);
  return response.data;
};

export const recordPatientVitals = async (vitalData) => {
  const response = await api.post('/vitals', vitalData);
  return response.data;
};
