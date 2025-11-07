const { poolPromise, sql } = require('../db');
const { v4: uuidv4 } = require('uuid');

// File type enum for document types
const FileType = {
    PDF: 1,
    XLSX: 2,
    DOCX: 3,
    PPTX: 4,
    TXT: 5,
    PPT: 6,
    DOC: 7,
    CSV: 8,
    HTML: 9
};

// Export the enum for use in other modules
module.exports.FileType = FileType;

class DocumentMetadata {
    constructor() {
        this.tableName = 'document_meta_data';
        this.FileType = FileType; // Expose enum through instance
    }

    /**
     * Insert document metadata
     * @param {Object} metadata - Document metadata object
     * @returns {Promise<Object>} Insert result
     */
    async insertDocumentMetadata(metadata) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            // Generate UUID for document_guid if not provided
            const documentGuid = metadata.document_guid || uuidv4();
            
            console.log('📝 Attempting to insert document metadata with parameters...');
            
            // Try with all parameters first (new version)
            try {
                request.input('Id', sql.VarChar(255), metadata.id);
                request.input('DocumentGuid', sql.VarChar(255), documentGuid);
                request.input('FileName', sql.VarChar(255), metadata.file_name);
                request.input('IngestionSourceId', sql.Int, metadata.ingestion_source_id || 3);
                request.input('NumberOfPages', sql.Int, metadata.number_of_pages);
                request.input('IsActive', sql.Bit, metadata.is_active !== undefined ? metadata.is_active : 1);
                request.input('DatePublished', sql.DateTime, metadata.date_published || new Date());
                request.input('rawContent', sql.NVarChar(sql.MAX), metadata.blobUrl);
                request.input('DocumentCategory', sql.Int, metadata.document_category || 3);
                request.input('WorkspaceId', sql.VarChar(255), metadata.workspace_id || null);
                request.input('FileType', sql.Int, metadata.file_type || null);
                request.input('FileSize', sql.Int, metadata.file_size || null);

                console.log('🚀 Trying with all 12 parameters...');
                const result = await request.execute('sp_InsertDocumentMetadata');
                
                if (result.recordset && result.recordset.length > 0) {
                    console.log('✅ Successfully inserted with all parameters');
                    return {
                        success: true,
                        data: result.recordset[0]
                    };
                } else {
                    throw new Error('Failed to insert document metadata');
                }
                
            } catch (paramError) {
                if (paramError.message.includes('too many arguments')) {
                    console.log('⚠️ Too many arguments error, trying with reduced parameters...');
                    
                    // Try with core parameters only (fallback for older stored procedure)
                    const fallbackRequest = pool.request();
                    
                    fallbackRequest.input('Id', sql.VarChar(255), metadata.id);
                    fallbackRequest.input('DocumentGuid', sql.VarChar(255), documentGuid);
                    fallbackRequest.input('FileName', sql.VarChar(255), metadata.file_name);
                    fallbackRequest.input('IngestionSourceId', sql.Int, metadata.ingestion_source_id || 3);
                    fallbackRequest.input('NumberOfPages', sql.Int, metadata.number_of_pages);
                    fallbackRequest.input('IsActive', sql.Bit, metadata.is_active !== undefined ? metadata.is_active : 1);
                    fallbackRequest.input('DatePublished', sql.DateTime, metadata.date_published || new Date());
                    fallbackRequest.input('rawContent', sql.NVarChar(sql.MAX), metadata.blobUrl);
                    
                    console.log('🔄 Trying with core 8 parameters...');
                    const fallbackResult = await fallbackRequest.execute('sp_InsertDocumentMetadata');
                    
                    if (fallbackResult.recordset && fallbackResult.recordset.length > 0) {
                        console.log('✅ Successfully inserted with core parameters');
                        return {
                            success: true,
                            data: fallbackResult.recordset[0]
                        };
                    } else {
                        throw new Error('Failed to insert document metadata with fallback parameters');
                    }
                } else {
                    throw paramError;
                }
            }
            
        } catch (error) {
            console.error('❌ Error inserting document metadata:', error);
            throw new Error(`Failed to insert document metadata: ${error.message}`);
        }
    }

    /**
     * Get document metadata by document GUID
     * @param {string} documentGuid - Document GUID
     * @returns {Promise<Object>} Document metadata
     */
    async getDocumentMetadata(documentGuid) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('DocumentGuid', sql.VarChar(255), documentGuid);
            
            const result = await request.execute('sp_GetDocumentMetadata');
            
            if (result.recordset && result.recordset.length > 0) {
                return {
                    success: true,
                    data: result.recordset[0]
                };
            } else {
                return {
                    success: false,
                    message: 'Document metadata not found'
                };
            }
            
        } catch (error) {
            console.error('❌ Error getting document metadata:', error);
            throw new Error(`Failed to get document metadata: ${error.message}`);
        }
    }

    /**
     * Update document metadata
     * @param {string} id - Document ID
     * @param {Object} updates - Update fields
     * @returns {Promise<Object>} Update result
     */
    async updateDocumentMetadata(id, updates) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('Id', sql.VarChar(255), id);
            request.input('NumberOfPages', sql.Int, updates.number_of_pages);
            request.input('IsActive', sql.Bit, updates.is_active);
            request.input('DatePublished', sql.DateTime, updates.date_published);
            request.input('WorkspaceId', sql.VarChar(255), updates.workspace_id || null);
            request.input('FileType', sql.Int, updates.file_type || null);
            request.input('IngestionStatus', sql.VarChar(50), updates.ingestion_status || null);
            request.input('IngestionDate', sql.DateTime, updates.ingestion_date || null);
            request.input('DocumentCategory', sql.Int, updates.document_category || null);
            
            const result = await request.execute('sp_UpdateDocumentMetadata');
            
            if (result.recordset && result.recordset.length > 0) {
                return {
                    success: true,
                    data: result.recordset[0]
                };
            } else {
                throw new Error('Failed to update document metadata');
            }
            
        } catch (error) {
            console.error('❌ Error updating document metadata:', error);
            throw new Error(`Failed to update document metadata: ${error.message}`);
        }
    }

    /**
     * Get user ID from UserSessions table
     * @param {string} userEmail - User email
     * @returns {Promise<string>} User ID
     */
    async getUserIdFromEmail(userEmail) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('UserPrincipalName', sql.NVarChar(255), userEmail);
            
            const result = await request.query(`
                SELECT TOP 1 UserId 
                FROM UserSessions 
                WHERE UserPrincipalName = @UserPrincipalName 
                AND IsActive = 1 
                ORDER BY LastAccessDate DESC
            `);
            
            if (result.recordset && result.recordset.length > 0) {
                return result.recordset[0].UserId;
            } else {
                throw new Error(`User not found for email: ${userEmail}`);
            }
            
        } catch (error) {
            console.error('❌ Error getting user ID from email:', error);
            throw new Error(`Failed to get user ID: ${error.message}`);
        }
    }

    /**
     * Generate document metadata for upload
     * @param {string} fileName - Original file name
     * @param {string} userEmail - User email
     * @param {number} documentCategory - Document category ID (optional)
     * @returns {Promise<Object>} Generated metadata
     */
    async generateDocumentMetadata(fileName, userEmail, ingestionFileType, documentCategory = null) {
        try {
            // Get user ID from UserSessions table
            const userId = await this.getUserIdFromEmail(userEmail);
            
            // Generate document GUID
            const documentGuid = uuidv4();
            
            // Generate unique ID for the record
            const recordId = uuidv4();
            
            // Detect file type based on file extension
            const fileType = this.detectFileType(fileName);
            
            return {
                id: recordId,
                document_guid: documentGuid,
                file_name: fileName,
                ingestion_source_id: ingestionFileType,
                number_of_pages: null, // Will be updated later if needed
                is_active: 1,
                date_published: new Date(),
                workspace_id: userId, // This will be used for blob naming
                document_category: documentCategory, // Add document category
                file_type: fileType // Add detected file type
            };
            
        } catch (error) {
            console.error('❌ Error generating document metadata:', error);
            throw new Error(`Failed to generate document metadata: ${error.message}`);
        }
    }

    /**
     * Detect file type based on file extension
     * @param {string} fileName - File name with extension
     * @returns {number} File type ID from enum
     */
    detectFileType(fileName) {
        if (!fileName) return null;
        
        const extension = fileName.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'pdf':
                return this.FileType.PDF;
            case 'xlsx':
                return this.FileType.XLSX;
            case 'docx':
                return this.FileType.DOCX;
            case 'pptx':
                return this.FileType.PPTX;
            case 'txt':
                return this.FileType.TXT;
            case 'ppt':
                return this.FileType.PPT;
            case 'doc':
                return this.FileType.DOC;
            case 'csv':
                return this.FileType.CSV;
            case 'html':
            case 'htm':
                return this.FileType.HTML;
            default:
                return null; // Unknown file type
        }
    }

    /**
     * Get file type name from ID
     * @param {number} fileTypeId - File type ID
     * @returns {string} File type name
     */
    getFileTypeName(fileTypeId) {
        if (!fileTypeId) return null;
        
        switch (fileTypeId) {
            case this.FileType.PDF:
                return 'PDF';
            case this.FileType.XLSX:
                return 'XLSX';
            case this.FileType.DOCX:
                return 'DOCX';
            case this.FileType.PPTX:
                return 'PPTX';
            case this.FileType.TXT:
                return 'TXT';
            case this.FileType.PPT:
                return 'PPT';
            case this.FileType.DOC:
                return 'DOC';
            case this.FileType.CSV:
                return 'CSV';
            case this.FileType.HTML:
                return 'HTML';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get all available file types
     * @returns {Object} File type enum
     */
    static getFileTypes() {
        return FileType;
    }

    /**
     * Get document by GUID
     * @param {string} documentGuid - Document GUID
     * @returns {Promise<Object>} Document data
     */
    static async getDocumentByGuid(documentGuid) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('DocumentGuid', sql.VarChar(255), documentGuid);
            
            const result = await request.query(`
                SELECT 
                    id,
                    document_guid,
                    file_name,
                    ingestion_source_id,
                    number_of_pages,
                    is_active,
                    date_published,
                    raw_content,
                    file_type,
                    document_category,
                    workspace_id,
                    ingestion_status,
                    ingestion_date,
                    document_summary,
                    keywords,
                    category_suggestion,
                    file_size
                FROM document_meta_data WITH (NOLOCK)
                WHERE document_guid = @DocumentGuid
                AND is_active = 1
            `);
            
            if (result.recordset && result.recordset.length > 0) {
                return result.recordset[0];
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error getting document by GUID:', error);
            throw new Error(`Failed to get document: ${error.message}`);
        }
    }

    /**
     * Get documents by workspace ID
     * @param {string} workspaceId - Workspace ID
     * @returns {Promise<Array>} Documents list
     */
    static async getDocumentsByWorkspace(workspaceId) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('WorkspaceId', sql.VarChar(255), workspaceId);
            
            const result = await request.query(`
                SELECT 
                    id,
                    document_guid,
                    file_name,
                    ingestion_source_id,
                    number_of_pages,
                    is_active,
                    date_published,
                    raw_content,
                    file_type,
                    document_category,
                    workspace_id,
                    ingestion_status,
                    ingestion_date,
                    document_summary,
                    keywords,
                    category_suggestion,
                    file_size
                FROM document_meta_data WITH (NOLOCK)
                WHERE workspace_id = @WorkspaceId
                AND is_active = 1
                ORDER BY date_published DESC
            `);
            
            return result.recordset || [];
        } catch (error) {
            console.error('❌ Error getting documents by workspace:', error);
            throw new Error(`Failed to get documents: ${error.message}`);
        }
    }

    /**
     * Get documents by workspace and category
     * @param {string} workspaceId - Workspace ID
     * @param {string} documentCategory - Document category
     * @returns {Promise<Array>} Documents list
     */
    static async getDocumentsByWorkspaceAndCategory(workspaceId, documentCategory) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('WorkspaceId', sql.VarChar(255), workspaceId);
            request.input('DocumentCategory', sql.VarChar(255), documentCategory);
            
            const result = await request.query(`
                SELECT 
                    id,
                    document_guid,
                    file_name,
                    ingestion_source_id,
                    number_of_pages,
                    is_active,
                    date_published,
                    raw_content,
                    file_type,
                    document_category,
                    workspace_id,
                    ingestion_status,
                    ingestion_date,
                    document_summary,
                    keywords,
                    category_suggestion,
                    file_size
                FROM document_meta_data WITH (NOLOCK)
                WHERE workspace_id = @WorkspaceId
                AND document_category = @DocumentCategory
                AND is_active = 1
                ORDER BY date_published DESC
            `);
            
            return result.recordset || [];
        } catch (error) {
            console.error('❌ Error getting documents by workspace and category:', error);
            throw new Error(`Failed to get documents: ${error.message}`);
        }
    }

    /**
     * Get documents by ingestion source ID
     * @param {number} ingestionSourceId - Ingestion source ID
     * @returns {Promise<Object>} Documents list
     */
    async getDocumentsList(workspaceId) {
        try {
            // Force a fresh connection to avoid cached data issues
            const pool = await poolPromise;
            
            // Create a new request with explicit transaction isolation to ensure fresh data
            const request = pool.request();
            
            // Set read uncommitted to get the latest data (including recent inserts)
            // This prevents issues with connection pooling cached data
            await request.query('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
            
            request.input('WorkspaceId', sql.VarChar(255), workspaceId);
            
            console.log(`🔍 Fetching documents ONLY for workspace: ${workspaceId}`);
            
            // STRICT workspace filtering - only return documents for this specific workspace
            const result = await request.query(`
                SELECT 
                    id,
                    document_guid,
                    file_name,
                    ingestion_source_id,
                    number_of_pages,
                    is_active,
                    date_published,
                    raw_content,
                    file_type,
                    document_category,
                    workspace_id,
                    ingestion_status,
                    ingestion_date,
                    document_summary,
                    keywords,
                    category_suggestion,
                    file_size

                FROM document_meta_data WITH (NOLOCK)
                WHERE is_active = 1
                AND workspace_id = @WorkspaceId
                ORDER BY date_published DESC
            `);
            
            console.log(`📊 Found ${result.recordset.length} documents for workspace: ${workspaceId}`);
            
            // STRICT workspace filtering - NO fallbacks, NO additional queries
            // Only return documents that exactly match the user's workspace_id
            console.log(`✅ Workspace filtering: returning ONLY documents for workspace ${workspaceId}`);
            
            // Log workspace filtering for debugging  
            if (result.recordset.length > 0) {
                // Verify all returned documents belong to the correct workspace
                const workspaceIds = [...new Set(result.recordset.map(doc => doc.workspace_id))];
                console.log(`📋 Workspace IDs in results: ${workspaceIds.join(', ')}`);
                
                if (workspaceIds.length > 1 || workspaceIds[0] !== workspaceId) {
                    console.error(`🚨 WORKSPACE FILTERING FAILED - Expected only ${workspaceId}, got: ${workspaceIds.join(', ')}`);
                } else {
                    console.log(`✅ Workspace filtering verified - all documents belong to workspace: ${workspaceId}`);
                }
            } else {
                console.log(`ℹ️  No documents found for workspace: ${workspaceId}`);
            }
            
            return {
                success: true,
                data: result.recordset,
                totalCount: result.recordset.length,
                workspaceId: workspaceId,
                workspaceFiltered: true
            };
            
        } catch (error) {
            console.error('❌ Error getting documents by workspace:', error);
            throw new Error(`Failed to get documents by workspace: ${error.message}`);
        }
    }

    /**
     * Get document by ID
     * @param {string} documentId - Document ID
     * @returns {Promise<Object>} Document data
     */
    async getDocumentById(documentId) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            // Ensure fresh data read
            await request.query('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
            request.input('Id', sql.VarChar(255), documentId);
            
            console.log(`🔍 Fetching fresh document data for ID: ${documentId}`);
            
            const result = await request.query(`
                SELECT 
                    id,
                    document_guid,
                    file_name,
                    ingestion_source_id,
                    number_of_pages,
                    is_active,
                    date_published,
                    raw_content,
                    cleaned_content,
                    chunk_content,
                    embedding_content,
                    workspace_id,
                    file_type,
                    document_category,
                    ingestion_status,
                    ingestion_date
                FROM document_meta_data WITH (NOLOCK)
                WHERE id = @Id
                AND is_active = 1
            `);
            
            if (result.recordset && result.recordset.length > 0) {
                return result.recordset[0];
            } else {
                return null;
            }
            
        } catch (error) {
            console.error('❌ Error getting document by ID:', error);
            throw new Error(`Failed to get document by ID: ${error.message}`);
        }
    }

    /**
     * Update document ingestion status
     * @param {string} documentId - Document ID or GUID
     * @param {string} ingestionStatus - Ingestion status (pending, processing, completed, failed, error)
     * @param {Date} ingestionDate - Ingestion date (optional, defaults to current date)
     * @returns {Promise<Object>} Update result
     */
    async updateIngestionStatus(documentId, ingestionStatus, ingestionDate = null) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('DocumentId', sql.VarChar(255), documentId);
            request.input('IngestionStatus', sql.VarChar(50), ingestionStatus);
            request.input('IngestionDate', sql.DateTime, ingestionDate || new Date());
            
            const result = await request.execute('sp_UpdateDocumentIngestionStatus');
            
            if (result.recordset && result.recordset.length > 0) {
                return {
                    success: true,
                    data: result.recordset[0]
                };
            } else {
                throw new Error('Failed to update ingestion status');
            }
            
        } catch (error) {
            console.error('❌ Error updating ingestion status:', error);
            throw new Error(`Failed to update ingestion status: ${error.message}`);
        }
    }
}

// Export both the class instance and the FileType enum
module.exports = {
    DocumentMetadata: new DocumentMetadata(),
    FileType: FileType
}; 