const serviceBusService = require("../services/serviceBusService");

const INGESTION_FILE_TYPE = {
    SHAREPOINT: 1,
    WEB_SCAPED: 2,
    USER_UPLOAD: 3,
    SUMMARY: 4,
    AGENT: 5,
    CHAT: 6,
    EMAIL: 7,
    WEB_CLIP: 8
};

const INGESTION_SOURCE_NAMES = {
    1: 'SharePoint',
    2: 'Web Scraped',
    3: 'Local Upload',
};

const allowedMimeTypes = [
    'application/pdf',           
    'application/msword',        
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/csv',                  
    'application/sql',
    'application/vnd.ms-excel'           
  ];

const sendNotification = async (data, userId) => {
    console.log('Sending notification:', data);

    try {
        if (data.success && data.result) {
            // Publish SUCCESS event for successful scraping
            await serviceBusService.publishEvent('file-events', {
                eventType: 'file.uploaded.success',
                userId: userId, // Use actual authenticated user ID
                fileName: data.result.url || data.result.azure_upload?.blob_url,
                documentId: data.result.document_metadata?.document_guid,
                ingestionSource: INGESTION_FILE_TYPE.WEB_SCAPED, 
                timestamp: new Date().toISOString(),
                metadata: {
                    url: data.result.url,
                    fileSize: data.result.azure_upload?.file_size,
                    blobUrl: data.result.azure_upload?.blob_url,
                    workspaceId: data.result.workspace_id
                }
            });
            console.log('📤 Web scraping success event published');

        } else {
            // Publish ERROR event for failed scraping
            await serviceBusService.publishEvent('file-events', {
                eventType: 'file.uploaded.error',
                userId: userId, // Use actual authenticated user ID
                fileName: data.url || 'Web URL',
                error: data.message || data.error || 'Web scraping failed',
                ingestionSource: INGESTION_FILE_TYPE.WEB_SCAPED, // Web Scraped
                timestamp: new Date().toISOString(),
                metadata: {
                    url: data.url,
                    errorCode: data.errorCode || 'SCRAPING_ERROR',
                    statusCode: data.statusCode || 500
                }
            });
            console.log('📤 Web scraping error event published');
        }
    } catch (eventError) {
        console.error('⚠️ Failed to publish web scraping event:', eventError);
        // Don't fail the response if event publishing fails
    }
}

module.exports = {
    INGESTION_FILE_TYPE,
    INGESTION_SOURCE_NAMES,
    sendNotification,
    allowedMimeTypes
};