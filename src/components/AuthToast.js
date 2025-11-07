import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AuthToast.css';

const AuthToast = ({ message, type = 'info', isVisible, onClose, progress = 0 }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible && type === 'success') {
      // Auto-close success toast after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, type]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'loading':
        return (
          <div className="auth-toast-loading">
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="auth-toast-success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="auth-toast-error">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="auth-toast-info">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`auth-toast auth-toast-${type} ${isClosing ? 'closing' : ''}`}
          initial={{ opacity: 0, y: -100, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.3 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.6
          }}
        >
          <div className="auth-toast-content">
            <div className="auth-toast-icon">
              {getIcon()}
            </div>
            <div className="auth-toast-message">
              {message}
            </div>
            {type === 'success' && (
              <button className="auth-toast-close" onClick={handleClose}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          {type === 'loading' && progress > 0 && (
            <div className="auth-toast-progress">
              <motion.div 
                className="auth-toast-progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthToast;
