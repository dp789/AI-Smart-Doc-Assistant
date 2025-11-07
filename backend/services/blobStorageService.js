const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { DefaultAzureCredential, ClientSecretCredential } = require('@azure/identity');
const { v4: uuidv4 } = require('uuid');
const { DocumentMetadata } = require('../models/DocumentMetadata');

class BlobStorageService {
    constructor() {
        this.accountName = process.env.AZURE_STORAGE_ACCOUNT || 'smartdocaistorage';
        this.containerName = process.env.AZURE_STORAGE_CONTAINER || 'smartdocsaicontainer';
        this.blobDirectory = process.env.AZURE_STORAGE_DIRECTORY || 'originals';
        
        // Initialize the blob service client with better error handling
        this.initializeClient();
    }

    /**
     * Initialize the blob service client with appropriate credentials
     * Priority: 1. Connection String (Organization-wide), 2. Service Principal, 3. Default Azure Credentials
     */
    initializeClient() {
        try {
            // Priority 1: Use connection string for organization-wide access
            if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
                console.log('🔐 Using AZURE_STORAGE_CONNECTION_STRING for organization-wide blob storage access');
                this.blobServiceClient = BlobServiceClient.fromConnectionString(
                    process.env.AZURE_STORAGE_CONNECTION_STRING
                );
            } else {
                // Priority 2: Use service principal credentials if available
                if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
                    console.log('🔐 Using service principal credentials for blob storage');
                    const credential = new ClientSecretCredential(
                        process.env.AZURE_TENANT_ID,
                        process.env.AZURE_CLIENT_ID,
                        process.env.AZURE_CLIENT_SECRET
                    );
                    
                    this.blobServiceClient = new BlobServiceClient(
                        `https://${this.accountName}.blob.core.windows.net`,
                        credential
                    );
                } else {
                    // Priority 3: Fallback to default Azure credentials
                    console.log('🔐 Using default Azure credentials for blob storage');
                    const credential = new DefaultAzureCredential();
                    
                    this.blobServiceClient = new BlobServiceClient(
                        `https://${this.accountName}.blob.core.windows.net`,
                        credential
                    );
                }
            }
            
            this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        } catch (error) {
            console.error('❌ Error initializing blob storage client:', error);
            throw new Error(`Failed to initialize blob storage: ${error.message}`);
        }
    }

    /**
     * Generate a SAS token for a specific blob
     * @param {string} blobName - The name of the blob
     * @param {number} expiresInHours - Hours until token expires (default: 1)
     * @returns {Promise<string>} SAS token URL
     */
    async generateSasToken(blobName, expiresInHours = 1) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            
            // Check if blob exists first
            const exists = await blockBlobClient.exists();
            if (!exists) {
                throw new Error(`Blob '${blobName}' does not exist`);
            }

            // Generate SAS token
            const sasToken = generateBlobSASQueryParameters(
                {
                    accountName: this.accountName,
                    containerName: this.containerName,
                    blobName: blobName,
                    permissions: BlobSASPermissions.parse("r"), // Read permission only
                    startsOn: new Date(),
                    expiresOn: new Date(new Date().valueOf() + expiresInHours * 60 * 60 * 1000)
                },
                this.blobServiceClient.credential
            );

            const sasUrl = `${blockBlobClient.url}?${sasToken}`;
            return sasUrl;
        } catch (error) {
            console.error('❌ Error generating SAS token:', error);
            throw new Error(`Failed to generate SAS token: ${error.message}`);
        }
    }

    /**
     * Generate a SAS token for viewing purposes (read-only, short expiry)
     * @param {string} blobName - The name of the blob
     * @param {number} expiresInHours - Hours until token expires (default: 1)
     * @returns {Promise<string>} SAS token query string
     */
    async generateViewSasToken(blobName, expiresInHours = 1) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            
            // Check if blob exists first
            const exists = await blockBlobClient.exists();
            if (!exists) {
                throw new Error(`Blob '${blobName}' does not exist`);
            }

            // Generate SAS token for viewing (read-only, short expiry)
            const sasToken = generateBlobSASQueryParameters(
                {
                    accountName: this.accountName,
                    containerName: this.containerName,
                    blobName: blobName,
                    permissions: BlobSASPermissions.parse("r"), // Read permission only
                    startsOn: new Date(),
                    expiresOn: new Date(new Date().valueOf() + expiresInHours * 60 * 60 * 1000)
                },
                this.blobServiceClient.credential
            );

            return sasToken.toString();
        } catch (error) {
            console.error('❌ Error generating view SAS token:', error);
            throw new Error(`Failed to generate view SAS token: ${error.message}`);
        }
    }

    /**
     * Get blob content using SAS token
     * @param {string} blobName - The name of the blob
     * @returns {Promise<Object>} File data and metadata
     */
    async getFileWithSas(blobName) {
        try {
            console.log(`🔍 Attempting to get file with SAS token: ${blobName}`);
            
            // Generate SAS token
            const sasUrl = await this.generateSasToken(blobName);
            
            // Fetch content using SAS URL
            const response = await fetch(sasUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            return {
                success: true,
                data: buffer,
                properties: {
                    contentLength: buffer.length,
                    lastModified: new Date(),
                    contentType: response.headers.get('content-type') || 'application/octet-stream'
                }
            };
        } catch (error) {
            console.error('❌ Error getting file with SAS token:', error);
            throw new Error(`Failed to get file with SAS token: ${error.message}`);
        }
    }

    /**
     * List all blobs in the container to help debug missing files
     * @param {string} prefix - Optional prefix to filter blobs
     * @returns {Promise<Array>} List of blob names
     */
    async listBlobsWithPrefix(prefix = '') {
        try {
            const blobs = [];
            const listOptions = prefix ? { prefix } : {};
            
            for await (const blob of this.containerClient.listBlobsFlat(listOptions)) {
                blobs.push({
                    name: blob.name,
                    size: blob.properties.contentLength,
                    lastModified: blob.properties.lastModified,
                    contentType: blob.properties.contentType
                });
            }
            
            console.log(`📋 Found ${blobs.length} blobs with prefix '${prefix}'`);
            return blobs;
        } catch (error) {
            console.error('❌ Error listing blobs:', error);
            throw new Error(`Failed to list blobs: ${error.message}`);
        }
    }

    /**
     * Find blob by document metadata (alternative approach)
     * @param {Object} document - Document metadata
     * @returns {Promise<string>} Blob name if found
     */
    async findBlobByDocument(document) {
        try {
            // Handle different field name variations from database
            const workspaceId = document.workspace_id || document.workspaceId;
            const documentId = document.document_guid || document.documentGuid;
            const fileName = document.file_name || document.fileName;
            
            console.log('🔍 Document metadata for blob search:', {
                workspaceId,
                documentId,
                fileName,
                rawContent: document.raw_content
            });
            
            // If we have a raw_content URL, try to extract blob name from it
            if (document.raw_content) {
                try {
                    const urlParts = document.raw_content.split('/');
                    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'smartdocsaicontainer';
                    
                    const containerIndex = urlParts.findIndex(part => part === containerName);
                    if (containerIndex !== -1) {
                        const blobName = urlParts.slice(containerIndex + 1).join('/');
                        console.log('📄 Extracted blob name from URL:', blobName);
                        
                        // Check if this blob exists
                        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
                        const exists = await blockBlobClient.exists();
                        
                        if (exists) {
                            console.log(`✅ Found blob from URL: ${blobName}`);
                            return blobName;
                        } else {
                            console.log(`❌ Blob from URL does not exist: ${blobName}`);
                        }
                    }
                } catch (urlError) {
                    console.log('❌ Error extracting blob name from URL:', urlError.message);
                }
            }
            
            // If we have the required metadata, try different blob name patterns
            if (workspaceId && documentId && fileName) {
                const possibleBlobNames = [
                    `${this.blobDirectory}/${workspaceId}_${documentId}_3_${fileName}`,
                    `${workspaceId}_${documentId}_3_${fileName}`,
                    `${this.blobDirectory}/${fileName}`,
                    fileName
                ];
                
                console.log(`🔍 Searching for blob with possible names:`, possibleBlobNames);
                
                for (const blobName of possibleBlobNames) {
                    try {
                        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
                        const exists = await blockBlobClient.exists();
                        
                        if (exists) {
                            console.log(`✅ Found blob: ${blobName}`);
                            return blobName;
                        }
                    } catch (error) {
                        console.log(`❌ Blob not found: ${blobName}`);
                    }
                }
            } else {
                console.log('⚠️ Missing required metadata for blob search:', {
                    hasWorkspaceId: !!workspaceId,
                    hasDocumentId: !!documentId,
                    hasFileName: !!fileName
                });
            }
            
            // If not found, list all blobs to help debug
            console.log('🔍 Listing all blobs in container to help debug...');
            const allBlobs = await this.listBlobsWithPrefix();
            console.log('📋 Available blobs:', allBlobs.map(b => b.name));
            
            // Try to find any blob that might match the document
            if (fileName) {
                const matchingBlobs = allBlobs.filter(blob => 
                    blob.name.includes(fileName) || 
                    blob.name.includes(documentId) ||
                    blob.name.includes(workspaceId)
                );
                
                if (matchingBlobs.length > 0) {
                    console.log('🔍 Found potential matching blobs:', matchingBlobs.map(b => b.name));
                    return matchingBlobs[0].name;
                }
            }
            
            throw new Error(`Blob not found for document. Document: ${JSON.stringify({
                id: document.id,
                fileName: document.file_name,
                documentGuid: document.document_guid,
                workspaceId,
                documentId,
                fileName: fileName
            })}`);
        } catch (error) {
            console.error('❌ Error finding blob by document:', error);
            throw error;
        }
    }

    /**
     * Upload a file to Azure Blob Storage
     * @param {Buffer} fileBuffer - The file buffer to upload
     * @param {string} fileName - The name of the file
     * @param {string} contentType - The content type of the file
     * @param {string} userEmail - User email for getting workspace ID
     * @returns {Promise<Object>} - Upload result with blob URL and metadata
     */
    async uploadFile(fileBuffer, fileName, contentType, userEmail, ingestionFileType, documentCategory = null, size = null) {
        try {
            // Import DocumentMetadata model
            const { DocumentMetadata } = require('../models/DocumentMetadata');
            
            // Generate document metadata first to get workspace ID and document ID
            const metadata = await DocumentMetadata.generateDocumentMetadata(fileName, userEmail, ingestionFileType, documentCategory);
            
            // Create blob name in the format: originals/workspaceId_documentId_fileName_ingestionFileType
            const workspaceId = metadata.workspace_id;
            const documentId = metadata.document_guid;
            
            const blobName = `${this.blobDirectory}/${workspaceId}_${documentId}_${ingestionFileType}_${fileName}`;
            
            console.log(`🏷️  Blob name: ${blobName}`);
            console.log(`📋 Document metadata:`, {
                workspaceId,
                documentId,
                fileName,
                ingestionFileType,
                fileSize: size
            });
            
            // Get blob client
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            
            // Upload the file
            const uploadResult = await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
                blobHTTPHeaders: {
                    blobContentType: contentType
                }
            });

            // Get the blob URL
            const blobUrl = blockBlobClient.url;

            console.log('✅ File uploaded successfully');
            console.log(`🔗 Blob URL: ${blobUrl}`);

            // Insert document metadata into database
            try {
                metadata.blobUrl = blobUrl;
                metadata.file_size = size;
                console.log(`💾 Setting file size in metadata: ${size} bytes (${(size / 1024 / 1024).toFixed(2)} MB)`);
                const insertResult = await DocumentMetadata.insertDocumentMetadata(metadata);
                console.log('✅ Document metadata inserted successfully:', insertResult);

                // Call document categorization API after successful metadata insertion
                try {
                    const DocumentCategorizationService = require('./documentCategorizationService');
                    const categorizationService = new DocumentCategorizationService();
                    
                    const categorizationParams = {
                        workspace_id: metadata.workspace_id,
                        document_id: metadata.document_guid,
                        ingestion_source_id: metadata.ingestion_source_id || '3', // Default to '3' for System User
                        blob_url: blobUrl
                    };

                    console.log('🚀 Initiating document categorization with params:', {
                        workspace_id: categorizationParams.workspace_id,
                        document_id: categorizationParams.document_id,
                        ingestion_source_id: categorizationParams.ingestion_source_id,
                        blob_url: blobUrl.substring(0, 100) + '...' // Log partial URL for security
                    });

                    const categorizationResult = await categorizationService.categorizeDocument(categorizationParams);
                    
                    if (categorizationResult.success) {
                        console.log('✅ Document categorization completed successfully');
                    } else {
                        console.warn('⚠️  Document categorization failed:', categorizationResult.message);
                        // Don't throw error as the main upload was successful
                        // Just log the warning for debugging
                    }
                } catch (categorizationError) {
                    console.error('❌ Error during document categorization:', categorizationError);
                    // Don't throw error as the main upload was successful
                    // Just log the error for debugging
                }
            } catch (dbError) {
                console.error('❌ Error inserting document metadata:', dbError);
                // Don't throw here as the file was uploaded successfully
                // Just log the error for debugging
            }

            return {
                success: true,
                blobUrl: blobUrl,
                blobName: blobName,
                etag: uploadResult.etag,
                lastModified: uploadResult.lastModified,
                contentLength: uploadResult.contentLength,
                documentId: documentId,
                workspaceId: workspaceId,
                metadata: metadata
            };
        } catch (error) {
            console.error('❌ Error uploading file to blob storage:', error);
            
            // Provide more specific error messages
            if (error.message.includes('not authorized')) {
                throw new Error(`Storage access denied. Please check Azure permissions for storage account '${this.accountName}' and container '${this.containerName}'. Error: ${error.message}`);
            } else if (error.message.includes('ContainerNotFound')) {
                throw new Error(`Container '${this.containerName}' not found in storage account '${this.accountName}'. Please create the container first.`);
            } else if (error.message.includes('AccountNotFound')) {
                throw new Error(`Storage account '${this.accountName}' not found. Please check the account name.`);
            } else {
                throw new Error(`Failed to upload file: ${error.message}`);
            }
        }
    }

    /**
     * Delete a file from Azure Blob Storage
     * @param {string} blobName - The name of the blob to delete
     * @returns {Promise<boolean>} - Success status
     */
    async deleteFile(blobName) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.delete();
            return true;
        } catch (error) {
            console.error('Error deleting file from blob storage:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Get a file from Azure Blob Storage
     * @param {string} blobName - The name of the blob to get
     * @returns {Promise<Object>} - File data and metadata
     */
    async getFile(blobName) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
             const downloadResult = await blockBlobClient.download();
       
            
            return {
                success: true,
                data: downloadResult.readableStreamBody,
                properties: downloadResult.properties || {}
            };
        } catch (error) {
            console.error('Error getting file from blob storage:', error);
            throw new Error(`Failed to get file: ${error.message}`);
        }
    }

    /**
     * List all files in the container
     * @returns {Promise<Array>} - List of blob names
     */
    async listFiles() {
        try {
            const files = [];
            for await (const blob of this.containerClient.listBlobsFlat()) {
                files.push({
                    name: blob.name,
                    size: blob.properties.contentLength,
                    lastModified: blob.properties.lastModified,
                    contentType: blob.properties.contentType
                });
            }
            return files;
        } catch (error) {
            console.error('Error listing files from blob storage:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Validate if the storage account and container are accessible
     * @returns {Promise<boolean>} - Validation result
     */
    async validateConnection() {
        try {
            console.log('🔍 Validating blob storage connection...');
            
            // Try to list blobs to validate connection
            await this.containerClient.listBlobsFlat().next();
            
            console.log('✅ Blob storage connection validated successfully');
            return true;
        } catch (error) {
            console.error('❌ Blob storage connection validation failed:', error);
            
            // Provide specific error information
            if (error.message.includes('not authorized')) {
                console.error('🔐 Permission issue: The application does not have access to the storage account or container');
                console.error('💡 Solution: Grant the following roles to your service principal:');
                console.error('   - Storage Blob Data Contributor (for read/write access)');
                console.error('   - Storage Account Contributor (for container management)');
            } else if (error.message.includes('ContainerNotFound')) {
                console.error('📁 Container not found: The specified container does not exist');
                console.error('💡 Solution: Create the container or check the container name');
            } else if (error.message.includes('AccountNotFound')) {
                console.error('🏦 Account not found: The storage account does not exist');
                console.error('💡 Solution: Check the storage account name');
            }
            
            return false;
        }
    }



    /**
     * Get storage account information
     * @returns {Object} Storage account details
     */
    getStorageInfo() {
        let authMethod = 'Default Azure Credentials';
        if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
            authMethod = 'Organization-wide Connection String';
        } else if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
            authMethod = 'Service Principal Credentials';
        }
        
        return {
            accountName: this.accountName,
            containerName: this.containerName,
            blobDirectory: this.blobDirectory,
            accountUrl: `https://${this.accountName}.blob.core.windows.net`,
            authenticationMethod: authMethod,
            isOrganizationWide: !!process.env.AZURE_STORAGE_CONNECTION_STRING
        };
    }
}

module.exports = new BlobStorageService(); 