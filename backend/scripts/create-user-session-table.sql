-- =============================================
-- User Session Tracking Table for Microsoft SSO
-- =============================================

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

-- Create a view for active sessions
CREATE VIEW ActiveUserSessions AS
SELECT 
    SessionId,
    UserId,
    UserPrincipalName,
    DisplayName,
    FirstLoginDate,
    LastAccessDate,
    LoginCount,
    IPAddress,
    DeviceType,
    OperatingSystem,
    Browser,
    Country,
    UserRole,
    Department
FROM UserSessions
WHERE IsActive = 1 AND IsBlocked = 0;

-- Create stored procedure for user login tracking
CREATE PROCEDURE sp_TrackUserLogin
    @UserId NVARCHAR(255),
    @UserPrincipalName NVARCHAR(255),
    @DisplayName NVARCHAR(255) = NULL,
    @GivenName NVARCHAR(100) = NULL,
    @Surname NVARCHAR(100) = NULL,
    @TenantId NVARCHAR(255),
    @AppId NVARCHAR(255),
    @IPAddress NVARCHAR(45) = NULL,
    @UserAgent NVARCHAR(MAX) = NULL,
    @DeviceType NVARCHAR(50) = NULL,
    @OperatingSystem NVARCHAR(100) = NULL,
    @Browser NVARCHAR(100) = NULL,
    @BrowserVersion NVARCHAR(50) = NULL,
    @Country NVARCHAR(100) = NULL,
    @Region NVARCHAR(100) = NULL,
    @City NVARCHAR(100) = NULL,
    @Timezone NVARCHAR(50) = NULL,
    @ApplicationVersion NVARCHAR(50) = NULL,
    @UserRole NVARCHAR(100) = NULL,
    @Department NVARCHAR(100) = NULL,
    @CompanyName NVARCHAR(255) = NULL,
    @AdditionalData NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ExistingSessionId UNIQUEIDENTIFIER;
    DECLARE @IsFirstTime BIT = 0;
    
    -- Check if user already exists
    SELECT TOP 1 @ExistingSessionId = SessionId
    FROM UserSessions 
    WHERE UserId = @UserId AND UserPrincipalName = @UserPrincipalName;
    
    IF @ExistingSessionId IS NULL
    BEGIN
        -- New user - insert new record
        SET @IsFirstTime = 1;
        
        INSERT INTO UserSessions (
            UserId, UserPrincipalName, DisplayName, GivenName, Surname,
            TenantId, AppId, IPAddress, UserAgent, DeviceType, OperatingSystem,
            Browser, BrowserVersion, Country, Region, City, Timezone,
            ApplicationVersion, UserRole, Department, CompanyName,
            IsFirstTimeUser, AdditionalData, CreatedBy, ModifiedBy
        ) VALUES (
            @UserId, @UserPrincipalName, @DisplayName, @GivenName, @Surname,
            @TenantId, @AppId, @IPAddress, @UserAgent, @DeviceType, @OperatingSystem,
            @Browser, @BrowserVersion, @Country, @Region, @City, @Timezone,
            @ApplicationVersion, @UserRole, @Department, @CompanyName,
            @IsFirstTime, @AdditionalData, 'SYSTEM', 'SYSTEM'
        );
        
        SET @ExistingSessionId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Existing user - update last access and increment login count
        UPDATE UserSessions 
        SET 
            LastAccessDate = GETUTCDATE(),
            LoginCount = LoginCount + 1,
            IPAddress = COALESCE(@IPAddress, IPAddress),
            UserAgent = COALESCE(@UserAgent, UserAgent),
            DeviceType = COALESCE(@DeviceType, DeviceType),
            OperatingSystem = COALESCE(@OperatingSystem, OperatingSystem),
            Browser = COALESCE(@Browser, Browser),
            BrowserVersion = COALESCE(@BrowserVersion, BrowserVersion),
            Country = COALESCE(@Country, Country),
            Region = COALESCE(@Region, Region),
            City = COALESCE(@City, City),
            Timezone = COALESCE(@Timezone, Timezone),
            ApplicationVersion = COALESCE(@ApplicationVersion, ApplicationVersion),
            UserRole = COALESCE(@UserRole, UserRole),
            Department = COALESCE(@Department, Department),
            CompanyName = COALESCE(@CompanyName, CompanyName),
            IsFirstTimeUser = 0,
            ModifiedDate = GETUTCDATE(),
            ModifiedBy = 'SYSTEM',
            AdditionalData = COALESCE(@AdditionalData, AdditionalData)
        WHERE SessionId = @ExistingSessionId;
    END
    
    -- Return the session information
    SELECT 
        SessionId,
        UserId,
        UserPrincipalName,
        DisplayName,
        LoginCount,
        IsFirstTimeUser,
        LastAccessDate,
        FirstLoginDate
    FROM UserSessions 
    WHERE SessionId = @ExistingSessionId;
END;

-- Create procedure to get user session info
CREATE PROCEDURE sp_GetUserSession
    @UserId NVARCHAR(255) = NULL,
    @UserPrincipalName NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        SessionId,
        UserId,
        UserPrincipalName,
        DisplayName,
        GivenName,
        Surname,
        TenantId,
        FirstLoginDate,
        LastAccessDate,
        LoginCount,
        IPAddress,
        DeviceType,
        OperatingSystem,
        Browser,
        Country,
        UserRole,
        Department,
        IsActive,
        IsBlocked,
        IsFirstTimeUser
    FROM UserSessions 
    WHERE (UserId = @UserId OR @UserId IS NULL)
      AND (UserPrincipalName = @UserPrincipalName OR @UserPrincipalName IS NULL)
      AND IsActive = 1;
END;

-- Create cleanup procedure for old sessions
CREATE PROCEDURE sp_CleanupOldSessions
    @DaysToKeep INT = 90
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Soft delete old inactive sessions
    UPDATE UserSessions 
    SET IsActive = 0, ModifiedDate = GETUTCDATE()
    WHERE LastAccessDate < DATEADD(DAY, -@DaysToKeep, GETUTCDATE())
      AND IsActive = 1;
      
    SELECT @@ROWCOUNT AS SessionsDeactivated;
END;

PRINT 'UserSessions table and related objects created successfully!';