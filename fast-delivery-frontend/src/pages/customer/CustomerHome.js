import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/api';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import '../../styles/CustomerPortal.css';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 180px)', // Adjust based on header/footer height
  borderRadius: '15px'
};

const defaultCenter = {
  lat: 40.8457, // Alexandroupoli
  lng: 25.8733
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedStore, setSelectedStore] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [map, setMap] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  const filteredStores = stores.filter(store => 
    store.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (map && viewMode === 'map' && filteredStores.length > 0 && isLoaded) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidLoc = false;
      filteredStores.forEach(store => {
        if (store.location && store.location.coordinates) {
          bounds.extend({
            lat: store.location.coordinates[1],
            lng: store.location.coordinates[0]
          });
          hasValidLoc = true;
        }
      });
      if (hasValidLoc) {
        map.fitBounds(bounds);
      }
    }
  }, [map, viewMode, filteredStores, isLoaded]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Location access denied or error');
        }
      );
    }
  }, []);

  const categories = [
    { id: 'all', label: 'Όλα', icon: '🍽️' },
    { id: 'coffee', label: 'Καφές', icon: '☕' },
    { id: 'food', label: 'Φαγητό', icon: '🍔' },
    { id: 'market', label: 'Market', icon: '🛒' },
    { id: 'sweets', label: 'Γλυκά', icon: '🍰' },
    { id: 'pharmacy', label: 'Φαρμακείο', icon: '💊' },
    { id: 'other', label: 'Άλλο', icon: '🏪' },
  ];

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeCategory !== 'all') {
           // Map category to storeType
           const typeMap = {
             'coffee': 'Καφετέρια',
             'food': 'Ταβέρνα',
             'market': 'Mini Market',
             'sweets': 'Γλυκά', // Changed from 'Άλλο' to 'Γλυκά'
             'pharmacy': 'Φαρμακείο',
             'other': 'Άλλο'
           };
           params.storeType = typeMap[activeCategory];
        }
        
        // Use user's address as service area filter if available
        if (user?.address) {
            // Simple extraction of city/area from address could go here
            // For now, we rely on the backend's regex match if we pass it
            // params.serviceArea = user.address; 
        }

        const data = await customerService.getStores(params);
        if (data.success) {
          setStores(data.stores);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [activeCategory, user]);

  const handleStoreClick = (store) => {
    console.log('🖱️ Clicked Store:', store.businessName);
    navigate('/new-order', { state: { store } });
  };

  const handleCategoryClick = (catId) => {
    console.log('🖱️ Clicked Category:', catId);
    setActiveCategory(catId);
  };

  const handleNavClick = (action) => {
    console.log('🖱️ Clicked Nav Item:', action);
    if (action === 'search') {
      setShowSearch(!showSearch);
    } else if (action === 'orders') {
      if (user) {
        navigate('/my-orders');
      } else {
        navigate('/order-status/track');
      }
    } else if (action === 'profile') {
      // Navigate to profile or show modal
    } else if (action === 'home') {
      navigate('/order');
      setShowSearch(false);
      setActiveCategory('all');
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    console.log('🖱️ Clicked Logout');
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="location-pill">
            <span className="icon">📍</span>
            <span className="text">{user?.address || 'Αλεξανδρούπολη'}</span>
          </div>
          {user ? (
            <div className="user-profile-container" style={{ position: 'relative' }}>
              <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
                <div className="avatar">{user.name[0]}</div>
              </div>
              {showDropdown && (
                <div className="profile-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  padding: '8px 0',
                  zIndex: 1000,
                  minWidth: '150px'
                }}>
                  <div className="dropdown-item" style={{ padding: '8px 16px', cursor: 'pointer' }} onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i> Αποσύνδεση
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-small" onClick={() => { console.log('🖱️ Clicked Login'); navigate('/'); }}>Σύνδεση</button>
          )}
        </div>
        {showSearch && (
          <div className="search-bar-container" style={{ padding: '10px 0' }}>
            <input 
              type="text" 
              placeholder="Αναζήτηση καταστήματος..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ borderRadius: '20px' }}
              autoFocus
            />
          </div>
        )}
      </header>

      {/* Categories */}
      <div className="categories-scroll">
        {categories.map(cat => (
          <div 
            key={cat.id} 
            className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-label">{cat.label}</span>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="view-toggle-container" style={{ padding: '0 15px 10px', display: 'flex', justifyContent: 'flex-end' }}>
        <div className="btn-group" role="group">
          <button 
            type="button" 
            className={`btn btn-sm`}
            style={{ 
              backgroundColor: viewMode === 'list' ? '#4b92e3' : 'transparent', 
              color: viewMode === 'list' ? 'white' : '#4b92e3',
              borderColor: '#4b92e3'
            }}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list me-1"></i> Λίστα
          </button>
          <button 
            type="button" 
            className={`btn btn-sm`}
            style={{ 
              backgroundColor: viewMode === 'map' ? '#4b92e3' : 'transparent', 
              color: viewMode === 'map' ? 'white' : '#4b92e3',
              borderColor: '#4b92e3'
            }}
            onClick={() => setViewMode('map')}
          >
            <i className="fas fa-map-marker-alt me-1"></i> Χάρτης
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {viewMode === 'list' && <h2 className="section-title">Κοντά σας</h2>}
        
        {loading ? (
          <div className="loading-spinner">Φόρτωση...</div>
        ) : viewMode === 'list' ? (
          <div className="stores-list">
            {filteredStores.length > 0 ? (
              filteredStores.map(store => (
                <div key={store._id} className="store-card" onClick={() => handleStoreClick(store)}>
                  <div className="store-image-placeholder">
                    {store.storeType === 'Καφετέρια' ? '☕' : 
                     store.storeType === 'Mini Market' ? '🛒' : 
                     store.storeType === 'Ταβέρνα' ? '🍔' : 
                     store.storeType === 'Γλυκά' ? '🍰' :
                     store.storeType === 'Φαρμακείο' ? '💊' : '🏪'}
                  </div>
                  <div className="store-info">
                    <div className="store-header">
                      <h3>{store.businessName}</h3>
                      <span className="rating">★ 4.5</span>
                    </div>
                    <div className="store-meta">
                      <span className="delivery-time">{store.workingHours || '09:00 - 23:00'}</span>
                    </div>
                    <div className="store-address-hint">{store.address}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-stores">Δεν βρέθηκαν καταστήματα {searchTerm && `για "${searchTerm}"`}</div>
            )}
          </div>
        ) : (
          // Map View
          <div className="map-container" style={{ height: 'calc(100vh - 250px)', width: '100%' }}>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '15px' }}
                center={defaultCenter}
                zoom={14}
                onLoad={map => setMap(map)}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false
                }}
              >
                {/* Store Markers */}
                {filteredStores.map(store => {
                  // Ensure store has valid coordinates
                  if (!store.location || !store.location.coordinates) return null;
                  
                  const position = {
                    lat: store.location.coordinates[1], // MongoDB stores as [lng, lat]
                    lng: store.location.coordinates[0]
                  };

                  return (
                    <Marker
                      key={store._id}
                      position={position}
                      onClick={() => setSelectedStore(store)}
                      icon={{
                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' // Can be customized based on store type
                      }}
                    />
                  );
                })}

                {/* Info Window for Selected Store */}
                {selectedStore && (
                  <InfoWindow
                    position={{
                      lat: selectedStore.location.coordinates[1],
                      lng: selectedStore.location.coordinates[0]
                    }}
                    onCloseClick={() => setSelectedStore(null)}
                  >
                    <div style={{ padding: '5px', maxWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 5px', fontSize: '16px' }}>{selectedStore.businessName}</h4>
                      <p style={{ margin: '0 0 5px', fontSize: '12px', color: '#666' }}>{selectedStore.storeType}</p>
                      <p style={{ margin: '0 0 10px', fontSize: '12px' }}>{selectedStore.workingHours}</p>
                      <button 
                        className="btn btn-primary btn-sm w-100"
                        onClick={() => handleStoreClick(selectedStore)}
                      >
                        Παραγγελία
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div>Loading Map...</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className={`nav-item ${!showSearch ? 'active' : ''}`} onClick={() => handleNavClick('home')}>
          <span className="icon">🏠</span>
          <span className="label">Αρχική</span>
        </div>
        <div className={`nav-item ${showSearch ? 'active' : ''}`} onClick={() => handleNavClick('search')}>
          <span className="icon">🔍</span>
          <span className="label">Αναζήτηση</span>
        </div>
        <div className="nav-item" onClick={() => handleNavClick('orders')}>
          <span className="icon">📦</span>
          <span className="label">Παραγγελίες</span>
        </div>
        <div className="nav-item" onClick={() => handleNavClick('profile')}>
          <span className="icon">👤</span>
          <span className="label">Προφίλ</span>
        </div>
      </nav>
    </div>
  );
};

export default CustomerHome;
