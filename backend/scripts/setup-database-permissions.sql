-- Setup Database Permissions for SmartDocs Application
-- Run this in Azure Data Studio connected as Azure AD admin

-- Method 1: Create user for the application registration (Service Principal)
-- This grants access to the application itself
CREATE USER [SmartDocs-Application] FROM EXTERNAL PROVIDER WITH SID = '9da33bd8-2014-483a-8a03-0ce270f1dac0';
ALTER ROLE db_owner ADD MEMBER [SmartDocs-Application];

-- Verify creation
SELECT 
    name, 
    type_desc, 
    authentication_type_desc,
    create_date
FROM sys.database_principals 
WHERE name = 'SmartDocs-Application';

-- Method 2: Alternative - Create user for your admin account (for testing)
-- Replace 'your-email@nitorinfotech.com' with your actual admin email
-- CREATE USER [your-email@nitorinfotech.com] FROM EXTERNAL PROVIDER;
-- ALTER ROLE db_owner ADD MEMBER [your-email@nitorinfotech.com];

-- Method 3: If you create an Azure AD group called 'SmartDocs-Users'
-- CREATE USER [SmartDocs-Users] FROM EXTERNAL PROVIDER;
-- ALTER ROLE db_owner ADD MEMBER [SmartDocs-Users];

-- Check all external users
SELECT 
    name,
    type_desc,
    authentication_type_desc,
    create_date
FROM sys.database_principals 
WHERE authentication_type_desc = 'EXTERNAL'
ORDER BY create_date DESC;