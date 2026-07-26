import api from './api';

export const getPatientAppointments = async () => {
  const response = await api.get('/appointments/my');
  return response.data;
};

export const bookAppointment = async (apptData) => {
  const response = await api.post('/appointments', apptData);
  return response.data;
};
