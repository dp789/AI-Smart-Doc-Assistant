const axios = require("axios");
const https = require('https');
const { allowedMimeTypes } = require("../utils/helper");

// Class containing business logic for SharePoint operations
class SharepointClass {
  constructor() {}

  // Get list of SharePoint sites based on the domain
  async getSharepointSites(headers, sp_domain) {
    const getSitesUrl = `https://graph.microsoft.com/v1.0/sites/${sp_domain}/sites?search=*&top=50`;
    try {
      const response = await axios.get(getSitesUrl, { headers });
      const siteData = response.data;
      const siteList = siteData.value.map(site => ({
        createdDateTime: site.createdDateTime,
        site_id: site.id,
        lastModifiedDateTime: site.lastModifiedDateTime,
        label: site.displayName,
        type: "site",
      }));

      // Sort site names alphabetically
      siteList.sort((a, b) => a.label.localeCompare(b.label));

      return { status: true, site_names: siteList };
    } catch (err) {
      console.error("Error fetching SharePoint sites:", err);
      throw new Error("Error accessing SharePoint boundaries");
    }
  }

  // Get SharePoint Drive ID for the specified site
  async getSharepointDriveID(site_id, headers) {
    console.log("inside getSharepointDriveID, site_id:", site_id);
    const getDriveUrl = `https://graph.microsoft.com/v1.0/sites/${site_id}/drive?search=*&top=999`;
     
    // Create axios instance with SSL verification disabled
    const instance = axios.create({
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false // WARNING: Only use this for development
      })
    });

    try {
      const response = await instance.get(getDriveUrl, { headers });
      return {
        status: true,
        statusCode: response.status,
        drive_id: response.data.id,
      };
    } catch (err) {
      console.error("Error fetching Drive ID:", err);
      return {
        status: false,
        statusCode: err.response.status,
        message: err.response.statusText,
        data: err.response.data,
      };
    }
  }

  // Get folder list within a SharePoint drive
  async getSharepointFolderList(site_id, drive_id, headers) {
    const getFoldersUrl = `https://graph.microsoft.com/v1.0/sites/${site_id}/drives/${drive_id}/root/children?search=*&top=999`;
    const instance = axios.create({
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false // WARNING: Only use this for development
      })
    });
    try {
      const response = await instance.get(getFoldersUrl, { headers });
      const folders = response.data.value.filter(folder => !(folder.package && folder.package.type === 'oneNote'));

      const folderList = [];
      for (const folder of folders) {
        if (folder.folder) {
          folderList.push({
            createdDateTime: folder.createdDateTime,
            parentNodeID: site_id,
            item_id: folder.id,
            lastModifiedDateTime: folder.lastModifiedDateTime,
            label: folder.name,
            webUrl: folder.webUrl,
            type: "Folder",
            contentType: null,
          });
        } else {
          // For files, check MIME type and only include if supported
          try {
            const contentType = await this.getFileMimeType(site_id, folder.id, headers);
            console.log(`📁 File: ${folder.name}, MIME Type: ${contentType}`);

            // Only include file if MIME type is supported
            if (allowedMimeTypes.includes(contentType)) {
              folderList.push({
                createdDateTime: folder.createdDateTime,
                parentNodeID: site_id,
                item_id: folder.id,
                lastModifiedDateTime: folder.lastModifiedDateTime,
                label: folder.name,
                webUrl: folder.webUrl,
                type: "File",
                contentType: contentType,
              });
            }
          } catch (error) {
            console.warn(`⚠️ Could not get MIME type for ${folder.name}, excluding from list:`, error.message);
          }
        }
      }

      return { status: true, folder_level: folderList };
    } catch (err) {
      console.error("Error fetching folder list:", err);
      throw new Error("Error accessing SharePoint");
    }
  }

  // Traverse a SharePoint folder's structure
  async sharepointFolderTraversing(site_id, item_id, headers) {
    const traverseUrl = `https://graph.microsoft.com/v1.0/sites/${site_id}/drive/items/${item_id}/children?search=*&top=999`;
    const instance = axios.create({
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false // WARNING: Only use this for development
      })
    });
    try {
      const response = await instance.get(traverseUrl, { headers });
      const items = response.data.value;

      const folderLevel = [];
      for (const item of items) {
        if (item.folder) {
          folderLevel.push({
            createdDateTime: item.createdDateTime,
            parentNodeID: item_id,
            site_id,
            item_id: item.id,
            lastModifiedDateTime: item.lastModifiedDateTime,
            label: item.name,
            webUrl: item.webUrl,
            type: "Folder",
            downloadURL: item["@microsoft.graph.downloadUrl"],
            contentType: null,
          });
        } else {
          try {
            const contentType = await this.getFileMimeType(site_id, item.id, headers);
            console.log(`📁 File: ${item.name}, MIME Type: ${contentType}`);
            if (allowedMimeTypes.includes(contentType)) {
              folderLevel.push({
                createdDateTime: item.createdDateTime,
                parentNodeID: item_id,
                site_id,
                item_id: item.id,
                lastModifiedDateTime: item.lastModifiedDateTime,
                label: item.name,
                webUrl: item.webUrl,
                type: "File",
                downloadURL: item["@microsoft.graph.downloadUrl"],
                contentType: contentType,
              });
            }
          } catch (error) {
            console.warn(`⚠️ Could not get MIME type for ${item.name}, excluding from list:`, error.message);
          }
        }
      }

      return { status: true, folder_level: folderLevel };
    } catch (err) {
      console.error("Error traversing folder:", err);
      throw new Error("Error accessing SharePoint");
    }
  }

  // Get actual MIME type for a specific file from Microsoft Graph API
  async getFileMimeType(site_id, file_id, headers) {
    const fileMetadataUrl = `https://graph.microsoft.com/v1.0/sites/${site_id}/drive/items/${file_id}`;
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false 
      })
    });

    try {
      const response = await instance.get(fileMetadataUrl, { headers });
      const fileData = response.data;

      return fileData.file?.mimeType || null;
    } catch (err) {
      console.error(`Error fetching file metadata for ${file_id}:`, err.message);
      throw new Error(`Could not fetch file metadata: ${err.message}`);
    }
  }
}

module.exports = SharepointClass;