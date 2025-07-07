import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // Your NestJS backend URL
  withCredentials: true, // to send/receive cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
