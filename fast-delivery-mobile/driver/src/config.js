import Constants from 'expo-constants';

// =============================================================================
// ΑΥΤΟΜΑΤΗ ΕΠΙΛΟΓΗ ΠΕΡΙΒΑΛΛΟΝΤΟΣ
// =============================================================================
// - Για DEVELOPMENT (expo start): χρησιμοποιεί localhost
// - Για PREVIEW/PRODUCTION build: χρησιμοποιεί Render.com
// =============================================================================

// URLs για κάθε περιβάλλον
const ENV = {
  development: {
    apiUrl: 'http://192.168.31.160:5000',  //http://192.168.31.160:5000 Τοπικό IP (άλλαξέ το αν χρειαστεί)
    //apiUrl: 'https://fastdelivery-hvff.onrender.com',
  },
  production: {
    apiUrl: 'https://fastdelivery-hvff.onrender.com',
  },
};

// Αυτόματη ανίχνευση περιβάλλοντος
const getEnvVars = () => {
  // 1. Πρώτα έλεγξε αν υπάρχει ENV variable από EAS Build
  if (process.env.API_URL) {
    return { apiUrl: process.env.API_URL };
  }
  
  // 2. Έλεγξε αν τρέχει μέσω Expo Go (development)
  if (__DEV__) {
    return ENV.development;
  }
  
  // 3. Default: Production
  return ENV.production;
};

const envVars = getEnvVars();

// Exports
export const BASE_URL = envVars.apiUrl;
export const API_URL = `${BASE_URL}/api/v1`;
export const SOCKET_URL = BASE_URL;

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDUy3hiyc50qQv1ox6wyH4U9O_YsKyKdVE';

// Debug log (μόνο σε development)
if (__DEV__) {
  console.log('🔧 Config loaded:', { BASE_URL, API_URL });
}
