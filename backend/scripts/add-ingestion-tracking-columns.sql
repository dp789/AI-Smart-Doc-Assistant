-- =============================================
-- Add Ingestion Tracking Columns to Document Meta Data Table
-- This script adds ingestion_status and ingestion_date columns
-- to track AI processing status of documents
-- =============================================

-- Check if ingestion_status column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[document_meta_data]') AND name = 'ingestion_status')
BEGIN
    -- Add ingestion_status column
    ALTER TABLE [dbo].[document_meta_data] 
    ADD [ingestion_status] VARCHAR(50) NULL;
    
    PRINT '✅ Added ingestion_status column to document_meta_data table';
END
ELSE
BEGIN
    PRINT 'ℹ️ ingestion_status column already exists in document_meta_data table';
END

-- Check if ingestion_date column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[document_meta_data]') AND name = 'ingestion_date')
BEGIN
    -- Add ingestion_date column
    ALTER TABLE [dbo].[document_meta_data] 
    ADD [ingestion_date] DATETIME NULL;
    
    PRINT '✅ Added ingestion_date column to document_meta_data table';
END
ELSE
BEGIN
    PRINT 'ℹ️ ingestion_date column already exists in document_meta_data table';
END

-- Create index on ingestion_status column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_document_meta_data_ingestion_status')
BEGIN
    CREATE INDEX [IX_document_meta_data_ingestion_status] 
    ON [dbo].[document_meta_data] ([ingestion_status]);
    
    PRINT '✅ Created index on ingestion_status column';
END
ELSE
BEGIN
    PRINT 'ℹ️ Index on ingestion_status column already exists';
END

-- Create index on ingestion_date column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_document_meta_data_ingestion_date')
BEGIN
    CREATE INDEX [IX_document_meta_data_ingestion_date] 
    ON [dbo].[document_meta_data] ([ingestion_date]);
    
    PRINT '✅ Created index on ingestion_date column';
END
ELSE
BEGIN
    PRINT 'ℹ️ Index on ingestion_date column already exists';
END

-- Update the stored procedure sp_InsertDocumentMetadata
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_InsertDocumentMetadata]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_InsertDocumentMetadata];
    PRINT '🔄 Dropped existing sp_InsertDocumentMetadata procedure';
END

-- Create updated stored procedure with ingestion tracking
CREATE PROCEDURE [dbo].[sp_InsertDocumentMetadata]
    @Id VARCHAR(255),
    @DocumentGuid VARCHAR(255),
    @FileName VARCHAR(255),
    @IngestionSourceId INT,
    @NumberOfPages INT = NULL,
    @IsActive BIT = 1,
    @DatePublished DATETIME = NULL,
    @rawContent VARCHAR(255),
    @DocumentCategory INT = NULL,
    @WorkspaceId VARCHAR(255) = NULL,
    @FileType INT = NULL,
    @IngestionStatus VARCHAR(50) = NULL,
    @IngestionDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
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
        ingestion_date
    ) VALUES (
        @Id,
        @DocumentGuid,
        @FileName,
        @IngestionSourceId,
        @NumberOfPages,
        @IsActive,
        @DatePublished,
        @rawContent,
        @DocumentCategory,
        @WorkspaceId,
        @FileType,
        @IngestionStatus,
        @IngestionDate
    );
    
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
        ingestion_date
    FROM document_meta_data 
    WHERE id = @Id;
END;

PRINT '✅ Updated sp_InsertDocumentMetadata procedure with ingestion tracking parameters';

-- Update the stored procedure sp_GetDocumentMetadata
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetDocumentMetadata]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_GetDocumentMetadata];
    PRINT '🔄 Dropped existing sp_GetDocumentMetadata procedure';
END

-- Create updated stored procedure
CREATE PROCEDURE [dbo].[sp_GetDocumentMetadata]
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
        date_published,
        raw_content,
        document_category,
        workspace_id,
        file_type,
        ingestion_status,
        ingestion_date
    FROM document_meta_data 
    WHERE document_guid = @DocumentGuid AND is_active = 1;
END;

PRINT '✅ Updated sp_GetDocumentMetadata procedure with ingestion tracking fields';

-- Update the stored procedure sp_UpdateDocumentMetadata
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateDocumentMetadata]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_UpdateDocumentMetadata];
    PRINT '🔄 Dropped existing sp_UpdateDocumentMetadata procedure';
END

-- Create updated stored procedure
CREATE PROCEDURE [dbo].[sp_UpdateDocumentMetadata]
    @Id VARCHAR(255),
    @NumberOfPages INT = NULL,
    @IsActive BIT = NULL,
    @DatePublished DATETIME = NULL,
    @rawContent VARCHAR(255) = NULL,
    @DocumentCategory INT = NULL,
    @WorkspaceId VARCHAR(255) = NULL,
    @FileType INT = NULL,
    @IngestionStatus VARCHAR(50) = NULL,
    @IngestionDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE document_meta_data 
    SET 
        number_of_pages = ISNULL(@NumberOfPages, number_of_pages),
        is_active = ISNULL(@IsActive, is_active),
        date_published = ISNULL(@DatePublished, date_published),
        raw_content = ISNULL(@rawContent, raw_content),
        document_category = ISNULL(@DocumentCategory, document_category),
        workspace_id = ISNULL(@WorkspaceId, workspace_id),
        file_type = ISNULL(@FileType, file_type),
        ingestion_status = ISNULL(@IngestionStatus, ingestion_status),
        ingestion_date = ISNULL(@IngestionDate, ingestion_date)
    WHERE id = @Id;
    
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
        ingestion_date
    FROM document_meta_data 
    WHERE id = @Id;
END;

PRINT '✅ Updated sp_UpdateDocumentMetadata procedure with ingestion tracking parameters';

-- Create a new stored procedure to update ingestion status
CREATE PROCEDURE [dbo].[sp_UpdateDocumentIngestionStatus]
    @DocumentId VARCHAR(255),
    @IngestionStatus VARCHAR(50),
    @IngestionDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @IngestionDate IS NULL
        SET @IngestionDate = GETDATE();
    
    UPDATE document_meta_data 
    SET 
        ingestion_status = @IngestionStatus,
        ingestion_date = @IngestionDate
    WHERE id = @DocumentId OR document_guid = @DocumentId;
    
    SELECT 
        id,
        document_guid,
        file_name,
        ingestion_status,
        ingestion_date
    FROM document_meta_data 
    WHERE id = @DocumentId OR document_guid = @DocumentId;
END;

PRINT '✅ Created sp_UpdateDocumentIngestionStatus procedure';

-- Update the ActiveDocuments view
IF EXISTS (SELECT * FROM sys.views WHERE name = 'ActiveDocuments')
BEGIN
    DROP VIEW [dbo].[ActiveDocuments];
    PRINT '🔄 Dropped existing ActiveDocuments view';
END

-- Create updated view
CREATE VIEW [dbo].[ActiveDocuments] AS
SELECT 
    id,
    document_guid,
    file_name,
    ingestion_source_id,
    number_of_pages,
    date_published,
    document_category,
    workspace_id,
    file_type,
    ingestion_status,
    ingestion_date
FROM document_meta_data
WHERE is_active = 1;

PRINT '✅ Updated ActiveDocuments view with ingestion tracking fields';

-- Display current table structure
PRINT '📋 Current document_meta_data table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'document_meta_data'
ORDER BY ORDINAL_POSITION;

PRINT '✅ Ingestion tracking columns added successfully!';
PRINT '';
PRINT '📋 Ingestion Status Values:';
PRINT '   - NULL or empty: Not processed';
PRINT '   - "pending": Processing started';
PRINT '   - "processing": AI processing in progress';
PRINT '   - "completed": Successfully processed and embedded';
PRINT '   - "failed": Processing failed';
PRINT '   - "error": Error during processing';
