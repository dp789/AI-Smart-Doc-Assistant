require('isomorphic-fetch');  // This must be the first import
const SharepointClass = require("../middleware/sharepoint");
const { v4: uuidv4 } = require("uuid");
const fetch = require('node-fetch');  // Add this import at the top
const { Client } = require('@microsoft/microsoft-graph-client');
const blobStorageService = require('../services/blobStorageService');
const { INGESTION_FILE_TYPE } = require('../utils/helper');
const serviceBusService = require('../services/serviceBusService');

// Instantiate SharePoint service class to use its methods
const sharepointCLS = new SharepointClass();

// Fetch SharePoint sites for the specified domain
exports.getSharepointSites = async (req, res) => {
  try {
    const headers = {
      Authorization: req.headers.authorization,
      "Content-Type": "application/json",
    };
    const sp_domain_name = req.params.sp_domain_name;

    // Retrieve SharePoint sites using the service class
    const spDetails = await sharepointCLS.getSharepointSites(headers, sp_domain_name);

    if (spDetails.status) {
      return res.status(200).send({
        success: true,
        spDetails,
        message: "SharePoint sites fetched successfully.",
      });
    } else {
      return res.status(200).send({
        success: false,
        message: "Error retrieving SharePoint sites.",
      });
    }
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error.",
      result: err,
    });
  }
};

// Fetch SharePoint folder lists for the specified site or item
exports.getSharepointFolderLists = async (req, res) => {
  try {
    let site_id = req.body.site_id;
    const { item_id } = req.body;
    const siteIdParts = site_id.split(',');
    site_id = siteIdParts[1]; // Get the middle GUID



    if (!item_id) {
      // Retrieve the drive ID for the given site
      const getDriveID = await sharepointCLS.getSharepointDriveID(site_id, req.headers);

      if (getDriveID.status) {
        // Fetch folder list using the drive ID
        const spDetails = await sharepointCLS.getSharepointFolderList(site_id, getDriveID.drive_id, req.headers);

        if (spDetails.status) {
          return res.status(200).send({
            success: true,
            spDetails,
            message: "Folder list fetched successfully.",
          });
        } else {
          return res.status(200).send({
            success: false,
            message: "Unauthorized access to SharePoint.",
          });
        }
      } else {
        return res.status(getDriveID.statusCode).send({
          status: false,
          statusCode: getDriveID.statusCode,
          message: getDriveID.data.error.message,
        });
      }
    } else {
      // Traverse the folder structure if an item ID is provided
      const spDetails = await sharepointCLS.sharepointFolderTraversing(site_id, item_id, req.headers);

      if (spDetails.status) {
        return res.status(200).send({
          success: true,
          spDetails,
          message: "Folder list fetched successfully.",
        });
      } else {
        return res.status(200).send({
          success: false,
          message: "Unauthorized access to SharePoint.",
        });
      }
    }
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error.",
      result: err,
    });
  }
};

// Traverse SharePoint folder structure
exports.sharepointFolderTraverse = async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${req.headers.Authorization}`,
      "Content-Type": "application/json",
    };
    const { site_id, item_id } = req.body;

    // Traverse the folder structure using the SharePoint service
    const spFolderDetails = await sharepointCLS.sharepointFolderTraversing(site_id, item_id, headers);

    if (spFolderDetails.status) {
      return res.status(200).send({
        success: true,
        spFolderDetails,
        message: "Folder structure traversed successfully.",
      });
    } else {
      return res.status(200).send({
        success: false,
        message: "Unauthorized access to SharePoint.",
      });
    }
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error.",
      result: err,
    });
  }
};


exports.uploadFilesToSharepoint = async (req, res) => {
  try {
    const { files } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        message: 'Files array is required'
      });
    }

    // Initialize Graph Client
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, token);
      }
    });

    const uploadResults = [];
    for (const file of files) {
      try {

        // Get file content using Graph API
        const fileStream = await graphClient
          .api(`/sites/${file.site_id}/drive/items/${file.id}/content`)
          .get();

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        // Get file size from buffer
        const fileSize = fileBuffer.length;
        console.log(`📁 File: ${file.label}, Size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

        // Get user email from request (set by auth middleware)
        const userEmail = req.user?.email || req.user?.username || req.user?.preferred_username;

        if (!userEmail) {
          return res.status(401).json({
            success: false,
            message: 'User email not found. Please ensure you are properly authenticated.',
            code: 'NO_USER_EMAIL',
            userData: req.user ? Object.keys(req.user) : 'no user data'
          });
        }

        // Upload to blob storage
        const uploadResult = await blobStorageService.uploadFile(
          fileBuffer,
          file.label,
          file.contentType || 'application/octet-stream',
          userEmail,
          INGESTION_FILE_TYPE.SHAREPOINT,
          null, // documentCategory
          fileSize // Pass the file size
        );

        uploadResults.push({
          fileName: file.label,
          status: 'success',
          url: uploadResult.blobUrl
        });

        // Publish success event to Service Bus
        try {
          await serviceBusService.publishEvent('file-events', {
            eventType: 'file.uploaded.success',
            userId: req.user.id,
            fileName: file.label,
            documentId: uploadResult.documentId,
            ingestionSource: INGESTION_FILE_TYPE.SHAREPOINT,
            timestamp: new Date().toISOString(),
            metadata: {
              blobUrl: uploadResult.blobUrl,
              workspaceId: uploadResult.workspaceId
            }
          });
          console.log(`📤 SharePoint upload success event published for ${file.label}`);
        } catch (eventError) {
          console.error('⚠️ Failed to publish success event:', eventError);
          // Don't fail the upload if event publishing fails
        }

      } catch (error) {
        console.error(`Error uploading file ${file.label}:`, error);
        uploadResults.push({
          fileName: file.label,
          status: 'error',
          error: error.message
        });

        // Publish error event to Service Bus
        try {
          await serviceBusService.publishEvent('file-events', {
            eventType: 'file.uploaded.error',
            userId: req.user.id,
            fileName: file.label,
            error: error.message,
            ingestionSource: INGESTION_FILE_TYPE.SHAREPOINT,
            timestamp: new Date().toISOString(),
            metadata: {
              errorCode: 'SHAREPOINT_UPLOAD_ERROR'
            }
          });
          console.log(`📤 SharePoint upload error event published for ${file.label}`);
        } catch (eventError) {
          console.error('⚠️ Failed to publish error event:', eventError);
          // Don't modify the error if event publishing fails
        }
      }
    }

    res.json({
      success: true,
      results: uploadResults
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
};
