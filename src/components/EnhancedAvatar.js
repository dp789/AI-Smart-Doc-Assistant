import React, { useState } from 'react';
import { Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import './EnhancedAvatar.css';

/**
 * Enhanced Avatar component that displays user photo or fallback to styled initials
 * Features:
 * - User photo support with fallback
 * - Animated initials with gradient backgrounds
 * - Multiple size variants
 * - Loading states
 * - Error handling
 */
const EnhancedAvatar = ({
  userProfile,
  size = 'medium',
  showStatus = true,
  className = '',
  onClick = null,
  animate = true,
  variant = 'default' // default, header, card
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { width: 40, height: 40, fontSize: '1rem' },
    medium: { width: 60, height: 60, fontSize: '1.5rem' },
    large: { width: 80, height: 80, fontSize: '2rem' },
    xlarge: { width: 100, height: 100, fontSize: '2.5rem' }
  };

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Get gradient background based on initials
  const getGradientBackground = (initials) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)'
    ];
    
    const charCode = initials.charCodeAt(0) || 0;
    return gradients[charCode % gradients.length];
  };

  // Check if we should show the user photo
  const shouldShowPhoto = userProfile.photo && !imageError && !userProfile.loading;

  // Motion variants for animations
  const avatarVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 200,
        delay: 0.2
      }
    },
    hover: { 
      scale: 1.05,
      y: -2,
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
      transition: { type: "spring", stiffness: 300 }
    }
  };

  const Component = animate ? motion.div : 'div';
  const componentProps = animate ? {
    variants: avatarVariants,
    initial: "initial",
    animate: "animate",
    whileHover: onClick ? "hover" : undefined,
    className: `enhanced-avatar-container ${variant} ${className}`,
    onClick: onClick,
    style: { cursor: onClick ? 'pointer' : 'default' }
  } : {
    className: `enhanced-avatar-container ${variant} ${className}`,
    onClick: onClick,
    style: { cursor: onClick ? 'pointer' : 'default' }
  };

  return (
    <Component {...componentProps}>
      {/* Loading State */}
      {userProfile.loading && (
        <div 
          className="avatar-loading"
          style={{
            width: currentSize.width,
            height: currentSize.height,
            borderRadius: variant === 'card' ? '16px' : '50%'
          }}
        >
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* User Photo or Initials Avatar */}
      {!userProfile.loading && (
        <>
          {shouldShowPhoto ? (
            <div className="user-photo-container">
              <img
                src={userProfile.photo}
                alt={`${userProfile.name}'s profile`}
                className="user-photo"
                style={{
                  width: currentSize.width,
                  height: currentSize.height,
                  borderRadius: variant === 'card' ? '16px' : '50%'
                }}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              {imageLoaded && (
                <div className="photo-overlay" />
              )}
            </div>
          ) : (
            <Avatar
              className={`initials-avatar ${variant}`}
              sx={{
                width: currentSize.width,
                height: currentSize.height,
                fontSize: currentSize.fontSize,
                fontWeight: 700,
                background: getGradientBackground(userProfile.initials),
                color: 'white',
                border: variant === 'header' ? '3px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.5)',
                boxShadow: variant === 'card' ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 2px 10px rgba(0, 0, 0, 0.1)',
                borderRadius: variant === 'card' ? '16px' : '50%',
                '& .MuiAvatar-img': {
                  borderRadius: variant === 'card' ? '16px' : '50%'
                }
              }}
            >
              {userProfile.initials}
            </Avatar>
          )}

          {/* Status Indicator */}
          {showStatus && (
            <motion.div 
              className="avatar-status-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            />
          )}
        </>
      )}
    </Component>
  );
};

export default EnhancedAvatar;