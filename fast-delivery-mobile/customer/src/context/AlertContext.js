import React, { createContext, useState, useContext, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';
import Toast from '../components/Toast';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info'
  });

  const [toastState, setToastState] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  const showAlert = useCallback((title, message, buttons = [], type = 'info') => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      type
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  // Toast for simple OK-only messages
  const showToast = useCallback((message, type = 'success') => {
    setToastState({
      visible: true,
      message,
      type
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, showToast, hideToast }}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        type={alertState.type}
        onClose={hideAlert}
      />
      <Toast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onHide={hideToast}
      />
    </AlertContext.Provider>
  );
};
