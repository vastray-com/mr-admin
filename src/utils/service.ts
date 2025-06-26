import axios from 'axios';
import { ls } from '@/utils/ls';

export const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

service.interceptors.request.use(
  (config) => {
    const token = ls.token.get();
    if (token.at) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token.at}`;
    }
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response) => {
    // Handle successful response
    return response.data;
  },
  (error) => {
    // Handle response error
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error('Response error:', error.response);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Request error:', error.request);
    } else {
      // Something else happened in setting up the request
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  },
);
