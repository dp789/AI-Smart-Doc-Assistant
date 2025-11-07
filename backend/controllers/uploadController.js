const blobStorageService = require('../services/blobStorageService');
const { INGESTION_FILE_TYPE } = require('../utils/helper');
const Notification = require('../models/Notification');
const serviceBusService = require('../services/serviceBusService');
const { allowedMimeTypes } = require('../utils/helper');

class UploadController {
    /**
     * Upload a PDF file to Azure Blob Storage
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async uploadPdfFile(req, res) {
        try {
            console.log('📤 Upload request received');

            // Only log sensitive data in development
            if (process.env.NODE_ENV !== 'production') {
                console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
                console.log('👤 User info:', req.user);
            } else {
                console.log('👤 User authenticated:', !!req.user);
                console.log('📧 User email:', req.user?.email || 'not found');
            }

            // Check if file exists in request
            if (!req.file) {
                console.error('❌ No file in request');
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                    code: 'NO_FILE'
                });
            }

            const { originalname, mimetype, buffer, size } = req.file;
            console.log('📁 File details:', { originalname, mimetype, size });

            // Validate file type - only allow PDF files
            if (!allowedMimeTypes.includes(mimetype)) {
                console.error('❌ Invalid file type:', mimetype);
                return res.status(400).json({
                    success: false,
                    message: `Only ${allowedMimeTypes.join(", ")} files are allowed`,
                    code: 'INVALID_FILE_TYPE',
                    receivedType: mimetype
                });
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (size > maxSize) {
                console.error('❌ File too large:', size, 'max:', maxSize);
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds maximum limit of 10MB',
                    code: 'FILE_TOO_LARGE',
                    fileSize: size,
                    maxSize: maxSize
                });
            }

            // Get user email from request (set by auth middleware)
            const userEmail = req.user?.email || req.user?.username || req.user?.preferred_username;
            console.log('📧 User email:', userEmail);

            if (!userEmail) {
                console.error('❌ No user email found');
                console.error('👤 Available user data:', req.user);
                return res.status(401).json({
                    success: false,
                    message: 'User email not found. Please ensure you are properly authenticated.',
                    code: 'NO_USER_EMAIL',
                    userData: req.user ? Object.keys(req.user) : 'no user data'
                });
            }

            const ingestionFileType = INGESTION_FILE_TYPE.USER_UPLOAD;

            // Get document category from form data
            const documentCategory = req.body.category ? parseInt(req.body.category) : null;
            console.log('📋 Document category:', documentCategory);

            // Upload file to Azure Blob Storage
            const uploadResult = await blobStorageService.uploadFile(
                buffer,
                originalname,
                mimetype,
                userEmail,
                ingestionFileType,
                documentCategory,
                size
            );
            const userId = req.user.id;

            // Publish success event to Service Bus
            try {
                await serviceBusService.publishEvent('file-events', {
                    eventType: 'file.uploaded.success',
                    userId: userId,
                    fileName: originalname,
                    documentId: uploadResult.documentId,
                    ingestionSource: ingestionFileType,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        fileSize: size,
                        blobUrl: uploadResult.blobUrl,
                        workspaceId: uploadResult.workspaceId
                    }
                });
                console.log('📤 Upload success event published');
            } catch (eventError) {
                console.error('⚠️ Failed to publish success event:', eventError);
                // Don't fail the upload if event publishing fails
            }

            // Return success response
            res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    fileName: originalname,
                    fileSize: size,
                    blobUrl: uploadResult.blobUrl,
                    blobName: uploadResult.blobName,
                    documentId: uploadResult.documentId,
                    workspaceId: uploadResult.workspaceId,
                    uploadDate: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Upload error:', error);
            console.error('❌ Error stack:', error.stack);

            // Determine appropriate error response based on error type
            let statusCode = 500;
            let errorCode = 'UPLOAD_ERROR';
            let message = 'Failed to upload file';

            if (error.message.includes('not authorized') || error.message.includes('permission')) {
                statusCode = 403;
                errorCode = 'PERMISSION_DENIED';
                message = 'Access denied to storage service';
            } else if (error.message.includes('ContainerNotFound')) {
                statusCode = 503;
                errorCode = 'STORAGE_UNAVAILABLE';
                message = 'Storage container not available';
            } else if (error.message.includes('network') || error.message.includes('timeout')) {
                statusCode = 503;
                errorCode = 'NETWORK_ERROR';
                message = 'Network error occurred during upload';
            }

            // Publish error event to Service Bus
            try {
                const userId = req.user?.id;
                if (userId) {
                    await serviceBusService.publishEvent('file-events', {
                        eventType: 'file.uploaded.error',
                        userId: userId,
                        fileName: originalname || 'Unknown file',
                        error: error.message,
                        ingestionSource: INGESTION_FILE_TYPE.USER_UPLOAD, // Local Device
                        timestamp: new Date().toISOString(),
                        metadata: {
                            errorCode: errorCode,
                            statusCode: statusCode
                        }
                    });
                    console.log('📤 Upload error event published');
                }
            } catch (eventError) {
                console.error('⚠️ Failed to publish error event:', eventError);
                // Don't modify the error response if event publishing fails
            }

            res.status(statusCode).json({
                success: false,
                message: message,
                code: errorCode,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get upload status and validate blob storage connection
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUploadStatus(req, res) {
        try {
            // Validate blob storage connection
            const isConnected = await blobStorageService.validateConnection();

            if (!isConnected) {
                return res.status(503).json({
                    success: false,
                    message: 'Blob storage service is not available',
                    status: 'unavailable'
                });
            }

            // Get storage information including authentication method
            const storageInfo = blobStorageService.getStorageInfo();

            res.status(200).json({
                success: true,
                message: 'Upload service is ready',
                status: 'ready',
                config: {
                    storageAccount: storageInfo.accountName,
                    container: storageInfo.containerName,
                    directory: storageInfo.blobDirectory,
                    authenticationMethod: storageInfo.authenticationMethod,
                    isOrganizationWide: storageInfo.isOrganizationWide
                }
            });

        } catch (error) {
            console.error('Upload status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check upload status',
                error: error.message
            });
        }
    }

    /**
     * List uploaded files
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async listUploadedFiles(req, res) {
        try {
            const files = await blobStorageService.listFiles();

            res.status(200).json({
                success: true,
                message: 'Files retrieved successfully',
                data: {
                    files: files,
                    totalCount: files.length
                }
            });

        } catch (error) {
            console.error('List files error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to list files',
                error: error.message
            });
        }
    }

    /**
     * Delete an uploaded file
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteUploadedFile(req, res) {
        try {
            const { blobName } = req.params;

            if (!blobName) {
                return res.status(400).json({
                    success: false,
                    message: 'Blob name is required'
                });
            }

            await blobStorageService.deleteFile(blobName);

            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });

        } catch (error) {
            console.error('Delete file error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete file',
                error: error.message
            });
        }
    }
}

module.exports = new UploadController(); 