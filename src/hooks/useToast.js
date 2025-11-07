import { useState, useCallback } from 'react';

const useToast = () => {
     const [toast, setToast] = useState({
          open: false,
          severity: 'info', // 'success', 'error', 'warning', 'info'
          title: '',
          message: ''
     });

     const showToast = useCallback((severity, message, title = '') => {
          setToast({
               open: true,
               severity,
               title,
               message
          });
     }, []);

     const hideToast = useCallback(() => {
          setToast(prev => ({ ...prev, open: false }));
     }, []);

     // Convenience methods
     const showSuccess = useCallback((message, title = 'Success') => {
          showToast('success', message, title);
     }, [showToast]);

     const showError = useCallback((message, title = 'Error') => {
          showToast('error', message, title);
     }, [showToast]);

     const showWarning = useCallback((message, title = 'Warning') => {
          showToast('warning', message, title);
     }, [showToast]);

     const showInfo = useCallback((message, title = 'Info') => {
          showToast('info', message, title);
     }, [showToast]);

     return {
          toast,
          showToast,
          hideToast,
          showSuccess,
          showError,
          showWarning,
          showInfo
     };
};

export default useToast; 