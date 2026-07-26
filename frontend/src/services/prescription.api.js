import api from './api';

export const getPatientPrescriptions = async () => {
  const response = await api.get('/prescriptions/my');
  return response.data;
};

export const getDoctorPrescriptions = async () => {
  const response = await api.get('/prescriptions/doctor');
  return response.data;
};

export const createPrescription = async (prescriptionData) => {
  const response = await api.post('/prescriptions', prescriptionData);
  return response.data;
};
