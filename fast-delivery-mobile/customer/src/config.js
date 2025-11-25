// Ρυθμίσεις Σύνδεσης (Uncomment ανάλογα με το πού θέλεις να συνδεθείς)

// 1. LOCALHOST (Για ανάπτυξη στον υπολογιστή σου)
// Βεβαιώσου ότι το IP είναι σωστό (ipconfig/ifconfig)
// export const BASE_URL = 'http://192.168.31.160:5000';

// 2. PRODUCTION (Render.com)
export const BASE_URL = 'https://fastdelivery-hvff.onrender.com';

export const API_URL = `${BASE_URL}/api/v1`;
export const SOCKET_URL = BASE_URL;
