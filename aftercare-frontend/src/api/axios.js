import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  doctorRegister: (data) => api.post('/auth/doctor/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const patientAPI = {
  searchOrCreate: (data) => api.post('/patients/search-create', data),
};

export const prescriptionAPI = {
  create: (data) => api.post('/prescriptions/create', data),
  getPatientPrescriptions: () => api.get('/patient/prescriptions'),
};

export const medicineAPI = {
  markTaken: (scheduleId) => api.post(`/medicine/mark-taken/${scheduleId}`),
};

export const healthUpdateAPI = {
  create: (data) => api.post('/health-updates', data),
  getAll: () => api.get('/health-updates'),
};

export const doctorAPI = {
  getDashboard: () => api.get('/doctor/dashboard'),
  getPatients: () => api.get('/doctor/patients'),
  getPatientDetails: (patientId) => api.get(`/doctor/patients/${patientId}`),
};

export default api;