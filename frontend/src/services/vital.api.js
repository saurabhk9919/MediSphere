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

export const startDeviceSimulation = async (patientId) => {
  const response = await api.post('/vitals/device/start', { patientId });
  return response.data;
};

export const stopDeviceSimulation = async () => {
  const response = await api.post('/vitals/device/stop');
  return response.data;
};

export const getDeviceSimulationStatus = async () => {
  const response = await api.get('/vitals/device/status');
  return response.data;
};

export const updatePatientDeviceSource = async (patientId, deviceSource) => {
  const response = await api.put('/vitals/device/source', { patientId, deviceSource });
  return response.data;
};
