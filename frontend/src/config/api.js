// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (!process.env.REACT_APP_API_URL) {
  console.warn('REACT_APP_API_URL is not set. Using default: http://localhost:5000/api');
}

export default API_URL;
