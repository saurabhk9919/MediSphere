import api from './api';

export const getDoctors = async (params) => {
  const response = await api.get('/doctors', { params });
  return response.data;
};
