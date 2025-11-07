-- Create stored procedures for UserSessions table
-- Run this in Azure Portal Query Editor

-- 1. Create stored procedure for tracking user login
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
    
    DECLARE @SessionId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ExistingUserId NVARCHAR(255);
    DECLARE @LoginCount INT = 1;
    DECLARE @IsFirstTime BIT = 1;
    
    -- Check if user already exists
    SELECT @ExistingUserId = UserId, @LoginCount = LoginCount + 1
    FROM UserSessions 
    WHERE UserId = @UserId AND UserPrincipalName = @UserPrincipalName;
    
    IF @ExistingUserId IS NOT NULL
    BEGIN
        -- Update existing user
        SET @IsFirstTime = 0;
        
        UPDATE UserSessions 
        SET LastAccessDate = GETUTCDATE(),
            LoginCount = @LoginCount,
            IPAddress = COALESCE(@IPAddress, IPAddress),
            UserAgent = COALESCE(@UserAgent, UserAgent),
            DeviceType = COALESCE(@DeviceType, DeviceType),
            OperatingSystem = COALESCE(@OperatingSystem, OperatingSystem),
            Browser = COALESCE(@Browser, Browser),
            Country = COALESCE(@Country, Country),
            UserRole = COALESCE(@UserRole, UserRole),
            Department = COALESCE(@Department, Department),
            ModifiedDate = GETUTCDATE(),
            AdditionalData = COALESCE(@AdditionalData, AdditionalData)
        WHERE UserId = @UserId AND UserPrincipalName = @UserPrincipalName;
        
        -- Get the existing SessionId
        SELECT @SessionId = SessionId FROM UserSessions WHERE UserId = @UserId AND UserPrincipalName = @UserPrincipalName;
    END
    ELSE
    BEGIN
        -- Insert new user
        INSERT INTO UserSessions (
            SessionId, UserId, UserPrincipalName, DisplayName, GivenName, Surname,
            TenantId, AppId, IPAddress, UserAgent, DeviceType, OperatingSystem,
            Browser, Country, UserRole, Department, LoginCount, IsFirstTimeUser,
            AdditionalData
        ) VALUES (
            @SessionId, @UserId, @UserPrincipalName, @DisplayName, @GivenName, @Surname,
            @TenantId, @AppId, @IPAddress, @UserAgent, @DeviceType, @OperatingSystem,
            @Browser, @Country, @UserRole, @Department, @LoginCount, @IsFirstTime,
            @AdditionalData
        );
    END
    
    -- Return session information
    SELECT 
        SessionId = @SessionId,
        UserId = @UserId,
        UserPrincipalName = @UserPrincipalName,
        LoginCount = @LoginCount,
        IsFirstTimeUser = @IsFirstTime,
        LastAccessDate = GETUTCDATE(),
        Success = 1,
        Message = 'User login tracked successfully'
END;

GO

-- 2. Create stored procedure for getting user session
CREATE PROCEDURE sp_GetUserSession
    @UserId NVARCHAR(255)
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
        AppId,
        FirstLoginDate,
        LastAccessDate,
        LoginCount,
        AuthenticationMethod,
        IPAddress,
        UserAgent,
        DeviceType,
        OperatingSystem,
        Browser,
        Country,
        UserRole,
        Department,
        IsActive,
        IsBlocked,
        IsFirstTimeUser,
        CreatedDate,
        ModifiedDate,
        AdditionalData
    FROM UserSessions 
    WHERE UserId = @UserId AND IsActive = 1
    ORDER BY LastAccessDate DESC;
END;

GO

-- 3. Create stored procedure for updating last access
CREATE PROCEDURE sp_UpdateLastAccess
    @UserId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE UserSessions 
    SET LastAccessDate = GETUTCDATE(),
        ModifiedDate = GETUTCDATE()
    WHERE UserId = @UserId AND IsActive = 1;
    
    SELECT 
        Success = 1,
        Message = 'Last access updated successfully',
        UpdatedAt = GETUTCDATE()
END;

GO

-- 4. Create stored procedure for inserting document metadata
CREATE PROCEDURE sp_InsertDocumentMetadata
    @Id VARCHAR(255),
    @DocumentGuid VARCHAR(255),
    @FileName VARCHAR(255),
    @IngestionSourceId INT,
    @NumberOfPages INT = NULL,
    @IsActive BIT = 1,
    @DatePublished DATETIME = NULL,
    @rawContent NVARCHAR(MAX)
AS
BEGIN   
    SET NOCOUNT ON;
    
    -- Set default date if not provided
    IF @DatePublished IS NULL
        SET @DatePublished = GETUTCDATE();
    
    INSERT INTO document_meta_data (
        id,
        document_guid,      
        file_name,
        ingestion_source_id,
        number_of_pages,
        is_active,
        date_published,
        raw_content
    ) VALUES (
        @Id,
        @DocumentGuid,
        @FileName,
        @IngestionSourceId,
        @NumberOfPages,
        @IsActive,
        @DatePublished,
        @rawContent
    );
    
    -- Return the inserted record
    SELECT 
        id,
        document_guid,
        file_name,
        ingestion_source_id,
        number_of_pages,
        is_active,
        date_published,
        raw_content,
        Success = 1,
        Message = 'Document metadata inserted successfully'
    FROM document_meta_data 
    WHERE id = @Id;
END;

GO

-- 5. Create stored procedure for getting document metadata
CREATE PROCEDURE sp_GetDocumentMetadata
    @DocumentGuid VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        document_guid,
        file_name,
        ingestion_source_id,
        number_of_pages,
        is_active,
        date_published
    FROM document_meta_data 
    WHERE document_guid = @DocumentGuid AND is_active = 1;
END;

GO

-- 6. Create stored procedure for updating document metadata
CREATE PROCEDURE sp_UpdateDocumentMetadata
    @Id VARCHAR(255),
    @NumberOfPages INT = NULL,
    @IsActive BIT = NULL,
    @DatePublished DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE document_meta_data 
    SET 
        number_of_pages = COALESCE(@NumberOfPages, number_of_pages),
        is_active = COALESCE(@IsActive, is_active),
        date_published = COALESCE(@DatePublished, date_published)
    WHERE id = @Id;
    
    -- Return the updated record
    SELECT 
        id,
        document_guid,
        file_name,
        ingestion_source_id,
        number_of_pages,
        is_active,
        date_published,
        Success = 1,
        Message = 'Document metadata updated successfully'
    FROM document_meta_data 
    WHERE id = @Id;
END;