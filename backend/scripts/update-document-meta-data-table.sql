-- =============================================
-- Update Document Meta Data Table
-- Add document_category column if it doesn't exist
-- =============================================

-- Check if document_category column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[document_meta_data]') AND name = 'document_category')
BEGIN
    -- Add document_category column
    ALTER TABLE [dbo].[document_meta_data] 
    ADD [document_category] INT NULL;
    
    PRINT '✅ Added document_category column to document_meta_data table';
END
ELSE
BEGIN
    PRINT 'ℹ️ document_category column already exists in document_meta_data table';
END

-- Create index on document_category column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_document_meta_data_document_category')
BEGIN
    CREATE INDEX [IX_document_meta_data_document_category] 
    ON [dbo].[document_meta_data] ([document_category]);
    
    PRINT '✅ Created index on document_category column';
END
ELSE
BEGIN
    PRINT 'ℹ️ Index on document_category column already exists';
END

-- Update the stored procedure sp_InsertDocumentMetadata
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_InsertDocumentMetadata]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_InsertDocumentMetadata];
    PRINT '🔄 Dropped existing sp_InsertDocumentMetadata procedure';
END

-- Create updated stored procedure
CREATE PROCEDURE [dbo].[sp_InsertDocumentMetadata]
    @Id VARCHAR(255),
    @DocumentGuid VARCHAR(255),
    @FileName VARCHAR(255),
    @IngestionSourceId INT,
    @NumberOfPages INT = NULL,
    @IsActive BIT = 1,
    @DatePublished DATETIME = NULL,
    @rawContent VARCHAR(255),
    @DocumentCategory INT = NULL
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
        document_category
    ) VALUES (
        @Id,
        @DocumentGuid,
        @FileName,
        @IngestionSourceId,
        @NumberOfPages,
        @IsActive,
        @DatePublished,
        @rawContent,
        @DocumentCategory
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
        document_category
    FROM document_meta_data 
    WHERE id = @Id;
END;

PRINT '✅ Updated sp_InsertDocumentMetadata procedure with document_category parameter';

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
        document_category
    FROM document_meta_data 
    WHERE document_guid = @DocumentGuid AND is_active = 1;
END;

PRINT '✅ Updated sp_GetDocumentMetadata procedure with document_category field';

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
    @rawContent VARCHAR(255),
    @DocumentCategory INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE document_meta_data 
    SET 
        number_of_pages = ISNULL(@NumberOfPages, number_of_pages),
        is_active = ISNULL(@IsActive, is_active),
        date_published = ISNULL(@DatePublished, date_published),
        raw_content = ISNULL(@rawContent, raw_content),
        document_category = ISNULL(@DocumentCategory, document_category)
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
        document_category
    FROM document_meta_data 
    WHERE id = @Id;
END;

PRINT '✅ Updated sp_UpdateDocumentMetadata procedure with document_category parameter';

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
    document_category
FROM document_meta_data
WHERE is_active = 1;

PRINT '✅ Updated ActiveDocuments view with document_category field';

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

PRINT '✅ Document meta data table update completed successfully!'; 