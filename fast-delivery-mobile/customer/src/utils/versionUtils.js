// Version comparison utilities

/**
 * Compare two semantic version strings
 * @param {string} v1 - First version (e.g., "1.2.0")
 * @param {string} v2 - Second version (e.g., "1.3.0")
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export const compareVersions = (v1, v2) => {
  if (!v1 || !v2) return 0;
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
};

/**
 * Check if current version needs update
 * @param {string} currentVersion - App's current version
 * @param {object} versionInfo - { latest, minimum, storeUrl }
 * @returns {object} { needsUpdate: boolean, forceUpdate: boolean, storeUrl: string }
 */
export const checkVersionUpdate = (currentVersion, versionInfo) => {
  if (!versionInfo || !currentVersion) {
    return { needsUpdate: false, forceUpdate: false, storeUrl: '' };
  }
  
  const { latest, minimum, storeUrl } = versionInfo;
  
  // Force update if below minimum
  if (compareVersions(currentVersion, minimum) < 0) {
    return { needsUpdate: true, forceUpdate: true, storeUrl };
  }
  
  // Optional update if below latest
  if (compareVersions(currentVersion, latest) < 0) {
    return { needsUpdate: true, forceUpdate: false, storeUrl };
  }
  
  return { needsUpdate: false, forceUpdate: false, storeUrl };
};
