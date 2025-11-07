import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';

/**
 * Custom hook to fetch user profile information including photo
 * Handles both MSAL authenticated users and bypass mode gracefully
 */
export const useUserProfile = () => {
  const { instance, accounts } = useMsal();
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    initials: '',
    photo: null,
    loading: true,
    error: null
  });

  // Helper function to get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ').filter(n => n.length > 0);
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Enhanced bypass mode user with better avatar
  const getBypassModeUser = () => ({
    name: 'Deepak Singh',
    email: 'deepak.singh@nitor.infortech.com',
    initials: 'DS',
    photo: null, // No photo in bypass mode
    loading: false,
    error: null
  });

  // Fetch user photo from Microsoft Graph API
  const fetchUserPhoto = async (accessToken) => {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } else if (response.status === 404) {
        // User has no profile photo
        console.log('User has no profile photo');
        return null;
      } else {
        throw new Error(`Failed to fetch photo: ${response.status}`);
      }
    } catch (error) {
      console.warn('Error fetching user photo:', error);
      return null;
    }
  };

  // Get access token for Microsoft Graph API
  const getAccessToken = async () => {
    try {
      const request = {
        scopes: ['User.Read'],
        account: accounts[0]
      };

      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.warn('Error getting access token:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      const bypassMode = sessionStorage.getItem('bypass_auth') === 'true';
      
      if (bypassMode) {
        setUserProfile(getBypassModeUser());
        return;
      }

      if (!accounts || accounts.length === 0) {
        setUserProfile({
          name: 'User',
          email: '',
          initials: 'U',
          photo: null,
          loading: false,
          error: 'No user account found'
        });
        return;
      }

      try {
        const user = accounts[0];
        const name = user.name || user.username || 'User';
        const email = user.username || user.email || '';
        const initials = getUserInitials(name);

        // Set basic user info first
        setUserProfile(prev => ({
          ...prev,
          name,
          email,
          initials,
          loading: true,
          error: null
        }));

        // Try to fetch user photo
        const accessToken = await getAccessToken();
        let photo = null;
        
        if (accessToken) {
          photo = await fetchUserPhoto(accessToken);
        }

        setUserProfile(prev => ({
          ...prev,
          photo,
          loading: false
        }));

      } catch (error) {
        console.error('Error loading user profile:', error);
        setUserProfile(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    loadUserProfile();

    // Cleanup function to revoke object URLs
    return () => {
      if (userProfile.photo && userProfile.photo.startsWith('blob:')) {
        URL.revokeObjectURL(userProfile.photo);
      }
    };
  }, [accounts, instance]);

  // Cleanup photo URL when component unmounts
  useEffect(() => {
    return () => {
      if (userProfile.photo && userProfile.photo.startsWith('blob:')) {
        URL.revokeObjectURL(userProfile.photo);
      }
    };
  }, [userProfile.photo]);

  return userProfile;
};

export default useUserProfile;