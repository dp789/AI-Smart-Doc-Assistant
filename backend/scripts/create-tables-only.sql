-- Create UserSessions table for user tracking
-- Run this SQL in Azure Portal Query Editor

-- Drop existing table if it exists (optional)
-- DROP TABLE IF EXISTS UserSessions;

-- Create UserSessions table for comprehensive tracking
CREATE TABLE UserSessions (
    -- Primary Key
    SessionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- User Identity Information
    UserId NVARCHAR(255) NOT NULL, -- Microsoft Object ID (primary identifier)
    UserPrincipalName NVARCHAR(255) NOT NULL, -- User's email/UPN
    DisplayName NVARCHAR(255) NULL,
    GivenName NVARCHAR(100) NULL,
    Surname NVARCHAR(100) NULL,
    
    -- Azure AD Information
    TenantId NVARCHAR(255) NOT NULL,
    AppId NVARCHAR(255) NOT NULL, -- Application ID that user logged into
    
    -- Session Tracking
    FirstLoginDate DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    LastAccessDate DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    LoginCount INT NOT NULL DEFAULT 1,
    SessionToken NVARCHAR(MAX) NULL, -- Encrypted/hashed session identifier
    
    -- Authentication Details
    AuthenticationMethod NVARCHAR(50) DEFAULT 'Microsoft SSO',
    IdentityProvider NVARCHAR(100) DEFAULT 'Microsoft',
    AuthenticationTimestamp DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    
    -- Technical Information
    IPAddress NVARCHAR(45) NULL, -- IPv6 compatible
    UserAgent NVARCHAR(MAX) NULL,
    DeviceId NVARCHAR(255) NULL,
    DeviceType NVARCHAR(50) NULL, -- Mobile, Desktop, Tablet
    OperatingSystem NVARCHAR(100) NULL,
    Browser NVARCHAR(100) NULL,
    BrowserVersion NVARCHAR(50) NULL,
    
    -- Location Information (if available)
    Country NVARCHAR(100) NULL,
    Region NVARCHAR(100) NULL,
    City NVARCHAR(100) NULL,
    Timezone NVARCHAR(50) NULL,
    
    -- Application Context
    ApplicationVersion NVARCHAR(50) NULL,
    FeatureFlags NVARCHAR(MAX) NULL, -- JSON string of enabled features
    UserRole NVARCHAR(100) NULL,
    Department NVARCHAR(100) NULL,
    CompanyName NVARCHAR(255) NULL,
    
    -- Status and Flags
    IsActive BIT NOT NULL DEFAULT 1,
    IsBlocked BIT NOT NULL DEFAULT 0,
    IsFirstTimeUser BIT NOT NULL DEFAULT 1,
    RequiresPasswordReset BIT NOT NULL DEFAULT 0,
    
    -- Audit Fields
    CreatedDate DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    ModifiedDate DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy NVARCHAR(255) DEFAULT 'SYSTEM',
    ModifiedBy NVARCHAR(255) DEFAULT 'SYSTEM',
    
    -- Additional JSON Data for extensibility
    AdditionalData NVARCHAR(MAX) NULL -- JSON for any additional metadata
);

-- Create indexes for performance
CREATE UNIQUE INDEX IX_UserSessions_UserId_UserPrincipalName 
ON UserSessions (UserId, UserPrincipalName);

CREATE INDEX IX_UserSessions_UserPrincipalName 
ON UserSessions (UserPrincipalName);

CREATE INDEX IX_UserSessions_LastAccessDate 
ON UserSessions (LastAccessDate DESC);

CREATE INDEX IX_UserSessions_TenantId 
ON UserSessions (TenantId);

CREATE INDEX IX_UserSessions_IsActive 
ON UserSessions (IsActive);

CREATE INDEX IX_UserSessions_IPAddress 
ON UserSessions (IPAddress);

-- Insert a test record to verify everything works
INSERT INTO UserSessions (
    UserId, UserPrincipalName, DisplayName, TenantId, AppId, 
    DeviceType, OperatingSystem, Browser, Country
) VALUES (
    'test-user-id', 'test@nitorinfotech.com', 'Test User', 
    '8c3dad1d-b6bc-4f8b-939b-8263372eced6', '9da33bd8-2014-483a-8a03-0ce270f1dac0',
    'Desktop', 'Windows 10', 'Chrome', 'Unknown'
);

-- Verify the table was created and test record inserted
SELECT TOP 5 * FROM UserSessions ORDER BY CreatedDate DESC;