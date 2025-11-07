-- =============================================
-- Document Meta Data Table
-- =============================================

-- Create document_meta_data table
CREATE TABLE document_meta_data (
    id VARCHAR(255) PRIMARY KEY,
    document_guid VARCHAR(255) NULL,
    file_name VARCHAR(255) NULL,
    ingestion_source_id INT NULL,
    number_of_pages INT NULL,
    is_active BIT NULL,
    date_published DATETIME NULL,
    raw_content VARCHAR(255) NULL,
    document_category INT NULL,
    workspace_id VARCHAR(255) NULL
);

-- Create indexes for performance
CREATE INDEX IX_document_meta_data_document_guid 
ON document_meta_data (document_guid);

CREATE INDEX IX_document_meta_data_file_name 
ON document_meta_data (file_name);

CREATE INDEX IX_document_meta_data_ingestion_source_id 
ON document_meta_data (ingestion_source_id);

CREATE INDEX IX_document_meta_data_is_active 
ON document_meta_data (is_active);

CREATE INDEX IX_document_meta_data_document_category 
ON document_meta_data (document_category);

CREATE INDEX IX_document_meta_data_workspace_id 
ON document_meta_data (workspace_id);

-- Create a view for active documents
CREATE VIEW ActiveDocuments AS
SELECT 
    id,
    document_guid,
    file_name,
    ingestion_source_id,
    number_of_pages,
    date_published,
    document_category,
    workspace_id
FROM document_meta_data
WHERE is_active = 1;

-- Create stored procedure for inserting document metadata
CREATE PROCEDURE sp_InsertDocumentMetadata
    @Id VARCHAR(255),
    @DocumentGuid VARCHAR(255),
    @FileName VARCHAR(255),
    @IngestionSourceId INT,
    @NumberOfPages INT = NULL,
    @IsActive BIT = 1,
    @DatePublished DATETIME = NULL,
    @rawContent VARCHAR(255),
    @DocumentCategory INT = NULL,
    @WorkspaceId VARCHAR(255) = NULL
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
        workspace_id
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
        @WorkspaceId
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

GO

-- Create stored procedure for getting document metadata
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
        date_published,
        raw_content,
        document_category,
        workspace_id
    FROM document_meta_data 
    WHERE document_guid = @DocumentGuid AND is_active = 1;
END;

GO

-- Create stored procedure for updating document metadata
CREATE PROCEDURE sp_UpdateDocumentMetadata
    @Id VARCHAR(255),
    @NumberOfPages INT = NULL,
    @IsActive BIT = NULL,
    @DatePublished DATETIME = NULL,
    @rawContent VARCHAR(255),
    @DocumentCategory INT = NULL,
    @WorkspaceId VARCHAR(255) = NULL
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
        workspace_id = ISNULL(@WorkspaceId, workspace_id)
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

GO

PRINT '✅ Document meta data table and stored procedures created successfully'; 