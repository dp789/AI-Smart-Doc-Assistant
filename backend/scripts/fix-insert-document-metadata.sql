-- Fix sp_InsertDocumentMetadata stored procedure
-- This script addresses the "too many arguments" error

USE [nit-smartdcos];
GO

-- Check current stored procedure definition
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_InsertDocumentMetadata]') AND type in (N'P', N'PC'))
BEGIN
    PRINT '🔍 Current sp_InsertDocumentMetadata procedure exists';
    
    -- Get current procedure parameters
    SELECT 
        p.name as parameter_name,
        t.name as data_type,
        p.max_length,
        p.is_output
    FROM sys.parameters p
    INNER JOIN sys.types t ON p.user_type_id = t.user_type_id
    WHERE p.object_id = OBJECT_ID('sp_InsertDocumentMetadata')
    ORDER BY p.parameter_id;
END
ELSE
BEGIN
    PRINT '❌ sp_InsertDocumentMetadata procedure does not exist';
END

-- Drop and recreate the stored procedure with correct parameters
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_InsertDocumentMetadata]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_InsertDocumentMetadata];
    PRINT '🔄 Dropped existing sp_InsertDocumentMetadata procedure';
END

-- Create the stored procedure with exactly the parameters expected by the Node.js code
CREATE PROCEDURE [dbo].[sp_InsertDocumentMetadata]
    @Id VARCHAR(255),
    @DocumentGuid VARCHAR(255),
    @FileName VARCHAR(255),
    @IngestionSourceId INT,
    @NumberOfPages INT = NULL,
    @IsActive BIT = 1,
    @DatePublished DATETIME = NULL,
    @rawContent NVARCHAR(MAX),
    @DocumentCategory INT = NULL,
    @WorkspaceId VARCHAR(255) = NULL,
    @FileType INT = NULL,
    @IngestionStatus VARCHAR(50) = NULL,
    @IngestionDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        PRINT '📝 Inserting document metadata...';
        PRINT '   - Id: ' + COALESCE(@Id, 'NULL');
        PRINT '   - DocumentGuid: ' + COALESCE(@DocumentGuid, 'NULL');
        PRINT '   - FileName: ' + COALESCE(@FileName, 'NULL');
        PRINT '   - IngestionSourceId: ' + CAST(COALESCE(@IngestionSourceId, 0) AS VARCHAR);
        
        -- Check if the table has the expected columns
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'document_meta_data' AND COLUMN_NAME = 'id')
        BEGIN
            RAISERROR('Table document_meta_data does not have id column', 16, 1);
            RETURN;
        END
        
        -- Insert into the table
        INSERT INTO document_meta_data (
            id,
            document_guid,
            file_name,
            ingestion_source_id,
            number_of_pages,
            is_active,
            date_published,
            raw_content,
            document_category,
            workspace_id,
            file_type,
            ingestion_status,
            ingestion_date,
            created_at,
            updated_at
        ) VALUES (
            @Id,
            @DocumentGuid,
            @FileName,
            @IngestionSourceId,
            @NumberOfPages,
            @IsActive,
            COALESCE(@DatePublished, GETUTCDATE()),
            @rawContent,
            @DocumentCategory,
            @WorkspaceId,
            @FileType,
            COALESCE(@IngestionStatus, 'pending'),
            COALESCE(@IngestionDate, GETUTCDATE()),
            GETUTCDATE(),
            GETUTCDATE()
        );
        
        PRINT '✅ Document metadata inserted successfully';
        
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
            document_category,
            workspace_id,
            file_type,
            ingestion_status,
            ingestion_date,
            created_at,
            updated_at
        FROM document_meta_data 
        WHERE id = @Id;
        
    END TRY
    BEGIN CATCH
        PRINT '❌ Error inserting document metadata:';
        PRINT '   - Error Number: ' + CAST(ERROR_NUMBER() AS VARCHAR);
        PRINT '   - Error Message: ' + ERROR_MESSAGE();
        PRINT '   - Error Line: ' + CAST(ERROR_LINE() AS VARCHAR);
        
        -- Re-throw the error
        THROW;
    END CATCH
END;
GO

PRINT '✅ Fixed sp_InsertDocumentMetadata procedure created successfully';

-- Test the stored procedure parameters
PRINT '🧪 Testing stored procedure parameters...';
SELECT 
    'sp_InsertDocumentMetadata' as procedure_name,
    p.name as parameter_name,
    t.name as data_type,
    p.max_length,
    p.is_output,
    p.parameter_id
FROM sys.parameters p
INNER JOIN sys.types t ON p.user_type_id = t.user_type_id
WHERE p.object_id = OBJECT_ID('sp_InsertDocumentMetadata')
ORDER BY p.parameter_id;
