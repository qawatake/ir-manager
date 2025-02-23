import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getRemotes = async () => {
  const response = await api.get('/remotes');
  return response.data;
};

export const getRemote = async (id: number) => {
  const response = await api.get(`/remotes/${id}`);
  return response.data;
};

export const createRemote = async (name: string) => {
  const response = await api.post('/remotes', { name });
  return response.data;
};

export const updateRemote = async (id: number, name: string) => {
  await api.put(`/remotes/${id}`, { name });
};

export const deleteRemote = async (id: number) => {
  await api.delete(`/remotes/${id}`);
};

export const getButtons = async (remoteId: number) => {
  const response = await api.get(`/remotes/${remoteId}/buttons`);
  return response.data;
};

export const createButton = async (remoteId: number, name: string) => {
  const response = await api.post(`/remotes/${remoteId}/buttons`, { name });
  return response.data;
};

export const updateButton = async (id: number, name: string, irData: string) => {
  await api.put(`/buttons/${id}`, { name, ir_data: irData });
};

export const deleteButton = async (id: number) => {
  await api.delete(`/buttons/${id}`);
};

export const sendIrData = async (buttonId: number) => {
  await api.post(`/sendir/${buttonId}`);
};

export const getIrData = async (buttonId: number) => {
  const response = await api.get(`/irdata/${buttonId}`);
  return response.data;
};

export const listenIr = async (buttonId: number) => {
  await api.post(`/listenir/${buttonId}`);
};
