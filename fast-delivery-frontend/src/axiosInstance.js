import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://192.168.1.8:5000/api', // Το URL του backend σου
});

export default axiosInstance;