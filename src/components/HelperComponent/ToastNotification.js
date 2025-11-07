import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const TOAST_CONFIG = {
     duration: 6000,
     position: { vertical: 'bottom', horizontal: 'right' }
};

const ToastNotification = ({ toast, onClose }) => {
     return (
          <Snackbar
               open={toast.open}
               autoHideDuration={TOAST_CONFIG.duration}
               onClose={onClose}
               anchorOrigin={TOAST_CONFIG.position}
               className="toast-container"
          >
               <Alert
                    onClose={onClose}
                    severity={toast.severity}
                    sx={{
                         width: '100%',
                         minWidth: '300px',
                         maxWidth: '600px',
                         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                         borderRadius: '8px'
                    }}
               >
                    {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
                    {toast.message}
               </Alert>
          </Snackbar>
     );
};

export default ToastNotification; 