import api from '../config/api';

export const getAdminStats = async () => {
  const token = sessionStorage.getItem('token');
  const res = await api.get('/admin/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getAllUsers = async () => {
  const token = sessionStorage.getItem('token');
  const res = await api.get('/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getAuditLogs = async () => {
  const token = sessionStorage.getItem('token');
  const res = await api.get('/logs', { // Unified logs route
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getAllFiles = async () => {
  const token = sessionStorage.getItem('token');
  const res = await api.get('/admin/files', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
