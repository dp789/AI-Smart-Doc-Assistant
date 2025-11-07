const { DocumentMetadata } = require('../models/DocumentMetadata');
const BlobStorageService = require('../services/blobStorageService');
const BlobChunksService = require('../services/blobChunksService');
const axios = require('axios');

class DocumentController {
    /**
     * Get documents by ingestion source ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getDocumentsList(req, res) {
        try {
            const workspaceId = req.params.workspaceId;
            console.log(`🔍 Getting documents list for workspace: ${workspaceId}`);
            
            const result = await DocumentMetadata.getDocumentsList(workspaceId);

            // Transform the data to include upload status and ingestion status
            const transformedData = result.data.map(doc => {
                // Normalize ingestion status for backward compatibility
                let normalizedIngestionStatus = doc.ingestion_status;
                if (normalizedIngestionStatus === true || normalizedIngestionStatus === 'true') {
                    normalizedIngestionStatus = 'completed';
                } else if (normalizedIngestionStatus === false || normalizedIngestionStatus === 'false') {
                    normalizedIngestionStatus = 'failed';
                } else if (normalizedIngestionStatus === null || normalizedIngestionStatus === undefined) {
                    normalizedIngestionStatus = null;
                }

                return {
                id: doc.id,
                documentGuid: doc.document_guid,
                fileName: doc.file_name,
                ingestionSourceId: doc.ingestion_source_id,
                numberOfPages: doc.number_of_pages,
                isActive: doc.is_active,
                uploadTime: doc.date_published,
                uploadStatus: doc.is_active ? 'active' : 'inactive',
                rawContent: doc.raw_content,
                fileType: doc.file_type,
                documentCategory: doc.document_category,
                ingestionStatus: normalizedIngestionStatus,
                ingestionDate: doc.ingestion_date,
                workspaceId: doc.workspace_id,
                documentSummary: doc.document_summary,
                keywords: doc.keywords,
                categorySuggestions: doc.category_suggestion,
                fileSize: doc.file_size
                };
            });

            // Prepare response with enhanced metadata
            const responseData = {
                documents: transformedData,
                totalCount: result.totalCount
            };

            // Add metadata about workspace filtering if available
            if (result.primaryWorkspaceCount !== undefined) {
                responseData.metadata = {
                    primaryWorkspaceCount: result.primaryWorkspaceCount,
                    currentWorkspaceId: workspaceId
                };
                
                if (result.additionalDocumentsCount) {
                    responseData.metadata.additionalDocumentsCount = result.additionalDocumentsCount;
                }
                
                if (result.globalFallback) {
                    responseData.metadata.globalFallback = true;
                }
            }

            // Log success with details
            console.log(`✅ Successfully retrieved ${result.totalCount} documents for workspace ${workspaceId}`);
            if (result.warning) {
                console.warn(`⚠️  ${result.warning}`);
            }

            const response = {
                success: true,
                message: 'Documents retrieved successfully',
                data: responseData
            };

            // Include warning in response if present (for client-side logging)
            if (result.warning) {
                response.warning = result.warning;
            }

            res.status(200).json(response);

        } catch (error) {
            console.error('❌ Get documents error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve documents',
                error: error.message
            });
        }
    }

    /**
     * Get all documents (for general listing)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllDocuments(req, res) {
        try {
            const result = await DocumentMetadata.getDocumentsByIngestionSource(3); // Default to ingestion source 3
            
            // Transform the data to include upload status and ingestion status
            const transformedData = result.data.map(doc => {
                // Normalize ingestion status for backward compatibility
                let normalizedIngestionStatus = doc.ingestion_status;
                if (normalizedIngestionStatus === true || normalizedIngestionStatus === 'true') {
                    normalizedIngestionStatus = 'completed';
                } else if (normalizedIngestionStatus === false || normalizedIngestionStatus === 'false') {
                    normalizedIngestionStatus = 'failed';
                } else if (normalizedIngestionStatus === null || normalizedIngestionStatus === undefined) {
                    normalizedIngestionStatus = null;
                }

                return {
                id: doc.id,
                documentGuid: doc.document_guid,
                fileName: doc.file_name,
                ingestionSourceId: doc.ingestion_source_id,
                numberOfPages: doc.number_of_pages,
                isActive: doc.is_active,
                uploadTime: doc.date_published,
                uploadStatus: doc.is_active ? 'active' : 'inactive',
                    rawContent: doc.raw_content,
                    fileType: doc.file_type,
                    documentCategory: doc.document_category,
                    ingestionStatus: normalizedIngestionStatus,
                    ingestionDate: doc.ingestion_date
                };
            });

            res.status(200).json({
                success: true,
                message: 'Documents retrieved successfully',
                data: {
                    documents: transformedData,
                    totalCount: result.totalCount
                }
            });

        } catch (error) {
            console.error('Get all documents error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve documents',
                error: error.message
            });
        }
    }

    /**
     * Get document view URL by document ID (for viewing purposes)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getDocumentViewUrl(req, res) {
        try {
            const { documentId } = req.params;
            
            if (!documentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Document ID is required'
                });
            }

            // Get document metadata to find the blob URL
            const document = await DocumentMetadata.getDocumentById(documentId);
            
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            console.log('📄 Getting view URL for document:', {
                id: document.id,
                fileName: document.file_name,
                documentGuid: document.document_guid,
                workspaceId: document.workspace_id,
                ingestionSourceId: document.ingestion_source_id
            });

            // Try to get a viewable URL for the document
            let viewUrl = null;
            let errorDetails = [];

            // Approach 1: Try to extract blob name from raw_content URL
            if (document.raw_content) {
                try {
                    console.log('🔍 Approach 1: Extracting blob name from URL:', document.raw_content);
                    
                    const urlParts = document.raw_content.split('/');
                    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'smartdocsaicontainer';
                    
                    const containerIndex = urlParts.findIndex(part => part === containerName);
                    if (containerIndex !== -1) {
                        const blobName = urlParts.slice(containerIndex + 1).join('/');
                        console.log('📄 Extracted blob name from URL:', blobName);
                        
                        // Generate a SAS token for viewing (read-only, short expiry)
                        const sasToken = await BlobStorageService.generateViewSasToken(blobName);
                        if (sasToken) {
                            const containerUrl = process.env.AZURE_STORAGE_ACCOUNT_URL || 'https://smartdocsstorage.blob.core.windows.net';
                            viewUrl = `${containerUrl}/${containerName}/${blobName}?${sasToken}`;
                            console.log('✅ Successfully generated view URL with SAS token');
                        }
                    }
                } catch (error) {
                    console.log('❌ Approach 1 failed:', error.message);
                    errorDetails.push(`URL extraction failed: ${error.message}`);
                }
            }

            // Approach 2: Try to find blob by document metadata
            if (!viewUrl) {
                try {
                    console.log('🔍 Approach 2: Finding blob by document metadata');
                    const blobName = await BlobStorageService.findBlobByDocument(document);
                    const sasToken = await BlobStorageService.generateViewSasToken(blobName);
                    if (sasToken) {
                        const containerUrl = process.env.AZURE_STORAGE_ACCOUNT_URL || 'https://smartdocsstorage.blob.core.windows.net';
                        const containerName = process.env.AZURE_STORAGE_CONTAINER || 'smartdocsaicontainer';
                        viewUrl = `${containerUrl}/${containerName}/${blobName}?${sasToken}`;
                        console.log('✅ Successfully generated view URL using metadata search');
                    }
                } catch (error) {
                    console.log('❌ Approach 2 failed:', error.message);
                    errorDetails.push(`Metadata search failed: ${error.message}`);
                }
            }

            // If all approaches failed, return detailed error
            if (!viewUrl) {
                console.error('❌ All view URL generation approaches failed');
                console.error('📋 Error details:', errorDetails);
                
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate document view URL',
                    error: `All access methods failed. ${errorDetails.join('; ')}`,
                    debug: {
                        documentId: document.id,
                        fileName: document.file_name,
                        documentGuid: document.document_guid
                    }
                });
            }



            // Return the view URL
            res.status(200).json({
                success: true,
                message: 'Document view URL generated successfully',
                data: {
                    viewUrl: viewUrl,
                    fileName: document.file_name,
                    documentId: document.id,
                    contentType: getContentTypeFromFileName(document.file_name),
                    expiresIn: '1 hour', // SAS token expiry
                    accessMethod: 'SAS Token'
                }
            });

        } catch (error) {
            console.error('❌ Error generating document view URL:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get document content by document ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getDocumentContent(req, res) {
        try {
            const { documentId } = req.params;
            
            if (!documentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Document ID is required'
                });
            }

            // Get document metadata to find the blob URL
            const document = await DocumentMetadata.getDocumentById(documentId);
            
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            console.log('📄 Document metadata:', {
                id: document.id,
                fileName: document.file_name,
                documentGuid: document.document_guid,
                workspaceId: document.workspace_id,
                ingestionSourceId: document.ingestion_source_id,
                rawContent: document.raw_content,
                chunkContent: document.chunk_content ? 'Available' : 'Not available',
                cleanedContent: document.cleaned_content ? 'Available' : 'Not available'
            });

            // Prioritize chunk_content over raw_content for better AI processing
            if (document.chunk_content) {
                console.log('🔍 Using chunk_content URL for enhanced document processing');
                return await this.getChunkContentFromBlob(req, res, document);
            }

            console.log('🔍 Falling back to raw_content for original document');

            // Try multiple approaches to get the blob content
            let blobResult = null;
            let blobName = null;
            let errorDetails = [];

            // Approach 1: Try to extract blob name from raw_content URL
            if (document.raw_content) {
                try {
                    console.log('🔍 Approach 1: Extracting blob name from URL:', document.raw_content);
                    
                    const urlParts = document.raw_content.split('/');
                    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'smartdocsaicontainer';
                    
                    const containerIndex = urlParts.findIndex(part => part === containerName);
                    if (containerIndex !== -1) {
                        blobName = urlParts.slice(containerIndex + 1).join('/');
                        console.log('📄 Extracted blob name from URL:', blobName);
                        
                        // Try to get file using SAS token
                        blobResult = await BlobStorageService.getFileWithSas(blobName);
                        console.log('✅ Successfully retrieved blob using SAS token');
                    }
                } catch (error) {
                    console.log('❌ Approach 1 failed:', error.message);
                    errorDetails.push(`URL extraction failed: ${error.message}`);
                }
            }

            // Approach 2: Try to find blob by document metadata
            if (!blobResult) {
                try {
                    console.log('🔍 Approach 2: Finding blob by document metadata');
                    blobName = await BlobStorageService.findBlobByDocument(document);
                    blobResult = await BlobStorageService.getFileWithSas(blobName);
                    console.log('✅ Successfully retrieved blob using metadata search');
                } catch (error) {
                    console.log('❌ Approach 2 failed:', error.message);
                    errorDetails.push(`Metadata search failed: ${error.message}`);
                }
            }

            // Approach 3: Try direct blob access with original method
            if (!blobResult) {
                try {
                    console.log('🔍 Approach 3: Direct blob access');
                    if (blobName) {
                        blobResult = await BlobStorageService.getFile(blobName);
                        console.log('✅ Successfully retrieved blob using direct access');
                    }
                } catch (error) {
                    console.log('❌ Approach 3 failed:', error.message);
                    errorDetails.push(`Direct access failed: ${error.message}`);
                }
            }

            // If all approaches failed, return detailed error
            if (!blobResult) {
                console.error('❌ All blob access approaches failed');
                console.error('📋 Error details:', errorDetails);
                
                // List available blobs for debugging
                try {
                    const availableBlobs = await BlobStorageService.listBlobsWithPrefix();
                    console.log('📋 Available blobs in container:', availableBlobs.map(b => b.name));
                    
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch document content from storage',
                        error: `All access methods failed. ${errorDetails.join('; ')}`,
                        debug: {
                            documentId: document.id,
                            fileName: document.file_name,
                            documentGuid: document.document_guid,
                            attemptedBlobName: blobName,
                            availableBlobs: availableBlobs.map(b => b.name),
                            totalBlobs: availableBlobs.length
                        }
                    });
                } catch (listError) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch document content from storage',
                        error: `All access methods failed. ${errorDetails.join('; ')}`,
                        debug: {
                            documentId: document.id,
                            fileName: document.file_name,
                            documentGuid: document.document_guid,
                            attemptedBlobName: blobName,
                            listError: listError.message
                        }
                    });
                }
            }

            // Process the blob content
            try {
                console.log('🔍 Processing blob content...');
                
                // Handle different data formats
                let buffer;
                if (blobResult.data instanceof Buffer) {
                    buffer = blobResult.data;
                } else if (blobResult.data && typeof blobResult.data[Symbol.asyncIterator] === 'function') {
                    // Handle stream data
                    const chunks = [];
                    for await (const chunk of blobResult.data) {
                        chunks.push(chunk);
                    }
                    buffer = Buffer.concat(chunks);
                } else {
                    throw new Error('Unexpected blob data format');
                }

                const fileSize = blobResult.properties?.contentLength || buffer.length;
                const lastModified = blobResult.properties?.lastModified || new Date();

                // Determine content type based on file extension
                const fileName = document.file_name || '';
                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                
                let contentType = 'text/plain';

                // Handle different file types
                if (fileExtension === 'pdf') {
                    contentType = 'application/pdf';
                    // For PDFs, return base64 encoded content for binary handling
                    const base64Content = buffer.toString('base64');
                    res.status(200).json({
                        success: true,
                        message: 'Document content retrieved successfully',
                        data: {
                            content: base64Content,
                            contentType: contentType,
                            fileName: document.file_name,
                            fileSize: fileSize,
                            lastModified: lastModified,
                            isBinary: true,
                            accessMethod: 'SAS Token'
                        }
                    });
                    return;
                } else if (fileExtension === 'doc' || fileExtension === 'docx') {
                    contentType = 'application/msword';
                    // For Word documents, return base64 encoded content
                    const base64Content = buffer.toString('base64');
                    res.status(200).json({
                        success: true,
                        message: 'Document content retrieved successfully',
                        data: {
                            content: base64Content,
                            contentType: contentType,
                            fileName: document.file_name,
                            fileSize: fileSize,
                            lastModified: lastModified,
                            isBinary: true,
                            accessMethod: 'SAS Token'
                        }
                    });
                    return;
                } else if (fileExtension === 'txt') {
                    contentType = 'text/plain';
                } else if (fileExtension === 'json') {
                    contentType = 'application/json';
                    // Try to parse and format JSON
                    try {
                        const jsonContent = JSON.parse(buffer.toString('utf8'));
                        const content = JSON.stringify(jsonContent, null, 2);
                        res.status(200).json({
                            success: true,
                            message: 'Document content retrieved successfully',
                            data: {
                                content: content,
                                contentType: contentType,
                                fileName: document.file_name,
                                fileSize: fileSize,
                                lastModified: lastModified,
                                isBinary: false,
                                accessMethod: 'SAS Token'
                            }
                        });
                        return;
                    } catch (parseError) {
                        // If parsing fails, return as-is
                        console.warn('Failed to parse JSON content:', parseError.message);
                    }
                } else if (fileExtension === 'xml') {
                    contentType = 'application/xml';
                } else {
                    // For unknown file types, try to display as text
                    contentType = 'text/plain';
                }

                // For text-based files
                const content = buffer.toString('utf8');
                res.status(200).json({
                    success: true,
                    message: 'Document content retrieved successfully',
                    data: {
                        content: content,
                        contentType: contentType,
                        fileName: document.file_name,
                        fileSize: fileSize,
                        lastModified: lastModified,
                        isBinary: false,
                        accessMethod: 'SAS Token'
                    }
                });

            } catch (processingError) {
                console.error('❌ Error processing blob content:', processingError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process document content',
                    error: processingError.message
                });
            }

        } catch (error) {
            console.error('Get document content error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve document content',
                error: error.message
            });
        }
    }

    /**
     * Debug endpoint to check blob storage status and list available blobs
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async debugBlobStorage(req, res) {
        try {
            const { documentId } = req.params;
            
            console.log('🔍 Debug blob storage for document:', documentId);
            
            let document = null;
            if (documentId) {
                document = await DocumentMetadata.getDocumentById(documentId);
            }
            
            // Get storage info
            const storageInfo = BlobStorageService.getStorageInfo();
            
            // Test connection
            const connectionValid = await BlobStorageService.validateConnection();
            
            // List all blobs
            const allBlobs = await BlobStorageService.listBlobsWithPrefix();
            
            // If document provided, try to find its blob
            let documentBlobInfo = null;
            if (document) {
                try {
                    const blobName = await BlobStorageService.findBlobByDocument(document);
                    documentBlobInfo = {
                        found: true,
                        blobName: blobName,
                        document: {
                            id: document.id,
                            fileName: document.file_name,
                            documentGuid: document.document_guid,
                            rawContent: document.raw_content
                        }
                    };
                } catch (error) {
                    documentBlobInfo = {
                        found: false,
                        error: error.message,
                        document: {
                            id: document.id,
                            fileName: document.file_name,
                            documentGuid: document.document_guid,
                            rawContent: document.raw_content
                        }
                    };
                }
            }
            
            res.status(200).json({
                success: true,
                message: 'Blob storage debug information',
                data: {
                    storageInfo,
                    connectionValid,
                    totalBlobs: allBlobs.length,
                    blobs: allBlobs.map(b => ({
                        name: b.name,
                        size: b.size,
                        lastModified: b.lastModified,
                        contentType: b.contentType
                    })),
                    documentBlobInfo
                }
            });
            
        } catch (error) {
            console.error('Debug blob storage error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to debug blob storage',
                error: error.message
            });
        }
    }

    /**
     * Update document ingestion status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateIngestionStatus(req, res) {
        try {
            const { documentId } = req.params;
            const { ingestionStatus, ingestionDate } = req.body;
            
            if (!documentId || !ingestionStatus) {
                return res.status(400).json({
                    success: false,
                    message: 'Document ID and ingestion status are required'
                });
            }

            // Validate ingestion status
            const validStatuses = ['pending', 'processing', 'completed', 'failed', 'error'];
            if (!validStatuses.includes(ingestionStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ingestion status. Must be one of: ' + validStatuses.join(', ')
                });
            }

            const result = await DocumentMetadata.updateIngestionStatus(documentId, ingestionStatus, ingestionDate);

            res.status(200).json({
                success: true,
                message: 'Ingestion status updated successfully',
                data: result.data
            });

        } catch (error) {
            console.error('Update ingestion status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update ingestion status',
                error: error.message
            });
        }
    }

    /**
     * Update document metadata
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateDocumentMetadata(req, res) {
        try {
            const { documentId } = req.params;
            const { documentCategory } = req.body;
            
            if (!documentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Document ID is required'
                });
            }

            if (documentCategory === undefined || documentCategory === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Document category is required'
                });
            }

            // Validate that document category is a valid integer
            const categoryId = parseInt(documentCategory);
            if (isNaN(categoryId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Document category must be a valid integer'
                });
            }

            console.log(`🔄 Updating document ${documentId} with category ${categoryId}`);

            // Update the document metadata in the database
            const result = await DocumentMetadata.updateDocumentMetadata(documentId, {
                document_category: categoryId
            });

            if (result.success) {
                console.log(`✅ Successfully updated document ${documentId} with category ${categoryId}`);
                res.status(200).json({
                    success: true,
                    message: 'Document metadata updated successfully',
                    data: result.data
                });
            } else {
                throw new Error(result.message || 'Failed to update document metadata');
            }

        } catch (error) {
            console.error('❌ Update document metadata error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update document metadata',
                error: error.message
            });
        }
    }

    /**
     * Get processed chunk content from blob storage using chunk_content URL
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Object} document - Document metadata from database
     */
    async getChunkContentFromBlob(req, res, document) {
        try {
            console.log('🚀 Retrieving chunk content from blob storage');
            
            // Initialize blob chunks service to handle the download and processing
            const blobChunksService = new BlobChunksService();
            
            let chunksResult = null;
            let blobPath = null;
            
            // Extract blob path from chunk_content URL and use BlobStorageService
            if (document.chunk_content) {
                try {
                    console.log('🔍 Extracting blob path from chunk_content URL:', document.chunk_content);
                    
                    const urlParts = document.chunk_content.split('/');
                    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'smartdocsaicontainer';
                    
                    const containerIndex = urlParts.findIndex(part => part === containerName);
                    if (containerIndex !== -1) {
                        blobPath = urlParts.slice(containerIndex + 1).join('/');
                        console.log('📄 Extracted blob path from chunk_content URL:', blobPath);
                        
                        // Use BlobStorageService with proper authentication
                        console.log('🔐 Downloading chunks using authenticated blob storage service...');
                        const blobResult = await BlobStorageService.getFileWithSas(blobPath);
                        
                        if (blobResult && blobResult.success && blobResult.data) {
                            console.log('✅ Successfully retrieved chunks from blob storage with authentication');
                            
                            // Parse the JSON content
                            let parsedData;
                            if (typeof blobResult.data === 'string') {
                                parsedData = JSON.parse(blobResult.data);
                            } else if (Buffer.isBuffer(blobResult.data)) {
                                parsedData = JSON.parse(blobResult.data.toString('utf8'));
                            } else {
                                parsedData = blobResult.data;
                            }
                            
                            chunksResult = {
                                success: true,
                                chunksData: parsedData,
                                blobPath: blobPath,
                                metadata: {
                                    source: 'chunk_content_blob_storage',
                                    totalChunks: Array.isArray(parsedData) ? parsedData.length : 
                                                (parsedData.chunks ? parsedData.chunks.length : 0),
                                    retrievedAt: new Date().toISOString(),
                                    blobSize: blobResult.data.length
                                }
                            };
                        }
                    }
                } catch (error) {
                    console.log('❌ Failed to download from chunk_content blob storage:', error.message);
                }
            }
            
            // Fallback: Try to construct blob path using metadata if direct URL failed
            if (!chunksResult) {
                console.log('🔄 Falling back to metadata-based blob path construction');
                
                const documentMetadata = {
                    workspace_id: document.workspace_id || 'd4b2fbfe-702b-49d4-9b42-41d343c26da5',
                    document_id: document.document_guid || document.id,
                    ingestion_source_id: document.ingestion_source_id?.toString() || '3',
                    document_guid: document.document_guid
                };

                chunksResult = await blobChunksService.getDocumentChunks(documentMetadata);
            }
            
            if (!chunksResult || !chunksResult.success) {
                return res.status(404).json({
                    success: false,
                    error: 'No processed chunks found for document',
                    documentId: document.id,
                    chunkContentUrl: document.chunk_content,
                    suggestion: 'Document may need to be reprocessed to generate chunks'
                });
            }

            // Process chunks for clean content delivery
            const processedResult = await blobChunksService.processChunksForAI(
                chunksResult.chunksData,
                'balanced', // Default strategy for content endpoint
                20 // More chunks for content endpoint
            );

            if (!processedResult.success) {
                return res.status(500).json({
                    success: false,
                    error: `Failed to process chunks: ${processedResult.error}`,
                    documentId: document.id
                });
            }
            
            // Get chunks statistics
            const chunksStats = blobChunksService.getChunksStats(processedResult.chunks);

            console.log('✅ Successfully processed chunk content for enhanced delivery');
            
            // Return enhanced content response
            res.status(200).json({
                success: true,
                message: 'Enhanced document content retrieved successfully from chunks',
                format: 'enhanced_chunks',
                data: {
                    documentId: document.id,
                    fileName: document.file_name,
                    documentGuid: document.document_guid,
                    content: processedResult.originalContent?.text || processedResult.originalContent, // Clean, combined content
                    contentType: 'text/plain',
                    contentLength: processedResult.originalContent?.text ? processedResult.originalContent.text.length : 
                                 (typeof processedResult.originalContent === 'string' ? processedResult.originalContent.length : 0),
                    blobPath: chunksResult.blobPath,
                    isEnhanced: true,
                    processingInfo: {
                        ...processedResult.processingInfo,
                        stats: chunksStats,
                        source: 'chunk_content'
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Error retrieving chunk content:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve enhanced document content',
                error: error.message,
                documentId: document.id,
                fallbackSuggestion: 'Will attempt to use raw_content instead'
            });
        }
    }
}

// Helper function to get content type from filename
function getContentTypeFromFileName(fileName) {
    if (!fileName) return 'application/octet-stream';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'doc':
            return 'application/msword';
        case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls':
            return 'application/vnd.ms-excel';
        case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'svg':
            return 'image/svg+xml';
        case 'webp':
            return 'image/webp';
        case 'mp4':
            return 'video/mp4';
        case 'avi':
            return 'video/x-msvideo';
        case 'mov':
            return 'video/quicktime';
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'txt':
            return 'text/plain';
        case 'md':
            return 'text/markdown';
        default:
            return 'application/octet-stream';
    }
}

// Create instance and bind methods to preserve 'this' context
const documentControllerInstance = new DocumentController();

// Bind all methods to preserve 'this' context when used in routes
const boundController = {
    getDocumentsList: documentControllerInstance.getDocumentsList.bind(documentControllerInstance),
    getAllDocuments: documentControllerInstance.getAllDocuments.bind(documentControllerInstance),
    getDocumentContent: documentControllerInstance.getDocumentContent.bind(documentControllerInstance),
    getDocumentViewUrl: documentControllerInstance.getDocumentViewUrl.bind(documentControllerInstance),
    getChunkContentFromBlob: documentControllerInstance.getChunkContentFromBlob.bind(documentControllerInstance),
    updateIngestionStatus: documentControllerInstance.updateIngestionStatus.bind(documentControllerInstance),
    updateDocumentMetadata: documentControllerInstance.updateDocumentMetadata.bind(documentControllerInstance),
    debugBlobStorage: documentControllerInstance.debugBlobStorage.bind(documentControllerInstance)
};

module.exports = boundController; 