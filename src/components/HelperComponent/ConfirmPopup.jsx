import React from 'react';
import './ConfirmPopup.css';

const ConfirmPopup = ({ 
    isOpen, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    confirmButtonClass = 'confirm-button',
    cancelButtonClass = 'cancel-button',
    onConfirm, 
    onCancel,
    showIcon = true,
    icon = '⚠️',
    size = 'medium' // small, medium, large
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="confirm-popup-overlay" onClick={handleBackdropClick}>
            <div className={`confirm-popup ${size}`}>
                <div className="confirm-popup-header">
                    {showIcon && <span className="confirm-popup-icon">{icon}</span>}
                    <h3 className="confirm-popup-title">{title}</h3>
                </div>
                
                <div className="confirm-popup-content">
                    <p className="confirm-popup-message">{message}</p>
                </div>
                
                <div className="confirm-popup-actions">
                    <button 
                        className={`confirm-popup-button ${cancelButtonClass}`}
                        onClick={handleCancel}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`confirm-popup-button ${confirmButtonClass}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPopup;
