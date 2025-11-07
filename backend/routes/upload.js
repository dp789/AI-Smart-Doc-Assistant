const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const azureAuth = require('../middleware/azureAuth');
const { allowedMimeTypes } = require('../utils/helper');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only allow 1 file at a time
    },
    fileFilter: (req, file, cb) => {
        // Only allow PDF files right now
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Only ${allowedMimeTypes.join(", ")} files are allowed`), false);
        }
    }
});

// Upload PDF file to Azure Blob Storage (with full validation)
router.post('/pdf', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, upload.single('pdfFile'), uploadController.uploadPdfFile);

// Alternative upload route with basic authentication only (for testing)
router.post('/pdf-simple', azureAuth.authenticate, upload.single('pdfFile'), uploadController.uploadPdfFile);

// Get upload service status
router.get('/status', uploadController.getUploadStatus);

// Debug endpoint to check authentication and configuration
router.get('/debug', (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        
        res.json({
            success: true,
            message: 'Upload service debug info',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            cors: {
                origin: req.headers.origin,
                referer: req.headers.referer,
                userAgent: isProduction ? 'hidden-in-production' : req.headers['user-agent']
            },
            auth: {
                hasAuthHeader: !!req.headers.authorization,
                authType: req.headers.authorization ? req.headers.authorization.split(' ')[0] : null
            },
            storage: {
                accountName: process.env.AZURE_STORAGE_ACCOUNT || 'smartdocaistorage',
                containerName: process.env.AZURE_STORAGE_CONTAINER || 'smartdocsaicontainer',
                hasConnectionString: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
                hasServicePrincipal: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
                authMethod: process.env.AZURE_STORAGE_CONNECTION_STRING ? 'Connection String' : 'Service Principal'
            },
            deployment: {
                isLiveUrl: req.headers.host === 'nitor-smartdocs.azurewebsites.net',
                host: req.headers.host
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// List uploaded files (protected route)
router.get('/files', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, uploadController.listUploadedFiles);

// Delete uploaded file (protected route)
router.delete('/files/:blobName', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, uploadController.deleteUploadedFile);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds maximum limit of 10MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Only one file can be uploaded at a time'
            });
        }
    }
    
    if (error.message === `Only ${allowedMimeTypes.join(", ")} files are allowed`) {
        return res.status(400).json({
            success: false,
            message: `Only ${allowedMimeTypes.join(", ")} files are allowed`
        });
    }
    
    next(error);
});

module.exports = router; 