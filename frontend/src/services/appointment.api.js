import api from './api';

export const getPatientAppointments = async () => {
  const response = await api.get('/appointments/my');
  return response.data;
};
