import envConfig from './envConfig';

// IMPORTANT: Replace these values with your own Azure AD app registration values
// From the Azure Portal > App registrations > Your App > Overview
export const msalConfig = {
  auth: {
    clientId: "9da33bd8-2014-483a-8a03-0ce270f1dac0", // Application (client) ID
    authority: "https://login.microsoftonline.com/8c3dad1d-b6bc-4f8b-939b-8263372eced6", // Directory (tenant) ID
    redirectUri: envConfig.baseUrl, // Use environment-specific URL
    postLogoutRedirectUri: envConfig.baseUrl, // Use environment-specific URL
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false, // Set to false for modern browsers
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(message);
            return;
          case 1: // Warning
            console.warn(message);
            return;
          case 2: // Info
            console.info(message);
            return;
          case 3: // Verbose
            console.debug(message);
            return;
          default:
            return;
        }
      },
      piiLoggingEnabled: false,
      logLevel: envConfig.logLevel // Use environment-specific log level
    }
  }
};

// Add scopes for the ID token to be used at Microsoft identity platform endpoints
export const loginRequest = {
  scopes: [
    "User.Read",
    "profile",
    "email",
    "openid",
    "Sites.Read.All",
    "Sites.ReadWrite.All"
  ]
};

    //"Sites.Read.All",
    //"Sites.ReadWrite.All"

// Add the endpoints for Microsoft Graph API services you want to use
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
}; 