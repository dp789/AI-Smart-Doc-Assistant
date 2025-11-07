const express = require('express');
const router = express.Router();
const azureAuth = require('../middleware/azureAuth');

const sharepointControl = require("../controllers/sharepointController");

// Fetch SharePoint sites based on the domain name
router.get('/sharepoint-sites/:sp_domain_name', sharepointControl.getSharepointSites);

// Fetch SharePoint folder lists
router.post('/sharepoint-folders/', sharepointControl.getSharepointFolderLists);

// Traverse SharePoint folder structure
router.post('/sharepoint-traverse/', sharepointControl.sharepointFolderTraverse);

// Upload files to SharePoint
router.post('/upload-files', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, sharepointControl.uploadFilesToSharepoint);

module.exports = router;
