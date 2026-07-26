import api from './api';

export const getPatientAppointments = async () => {
  const response = await api.get('/appointments/my');
  return response.data;
};

export const bookAppointment = async (apptData) => {
  const response = await api.post('/appointments', apptData);
  return response.data;
};

export const cancelAppointment = async (appointmentId) => {
  const response = await api.patch(`/appointments/${appointmentId}/cancel`);
  return response.data;
};

export const getDoctorAppointments = async () => {
  const response = await api.get('/appointments/doctor');
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.patch(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};
