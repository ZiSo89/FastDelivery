// Geocoding utility using Google Maps API
const https = require('https');

/**
 * Geocode an address to coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if not found
 */
async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ GOOGLE_MAPS_API_KEY not set, skipping geocoding');
    return null;
  }

  if (!address || typeof address !== 'string') {
    console.warn('⚠️ Invalid address for geocoding:', address);
    return null;
  }

  try {
    // Add default region for better results (Greece/Alexandroupoli area)
    const fullAddress = `${address}, Αλεξανδρούπολη, Ελλάδα`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=gr&language=el`;

    console.log('🗺️ Geocoding address:', address);

    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('✅ Geocoding success:', location);
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      console.warn('⚠️ Geocoding failed:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);
    return null;
  }
}

/**
 * Convert coordinates to GeoJSON Point format
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {{type: string, coordinates: number[]}} - GeoJSON Point
 */
function toGeoJSONPoint(lat, lng) {
  return {
    type: 'Point',
    coordinates: [lng, lat]  // GeoJSON uses [longitude, latitude]
  };
}

module.exports = {
  geocodeAddress,
  toGeoJSONPoint
};
