const Notification = require('../models/Notification');

class NotificationHandler {
     constructor() {
          console.log('🔔 Notification Handler initialized');
     }

     /**
      * Handle file upload events
      * @param {object} eventData - Event data from Service Bus
      */
     async handleFileEvent(eventData) {
          try {
               console.log(`🔔 Received notification event: ${eventData.eventType}`);
               console.log(`📄 File: ${eventData.fileName}, User: ${eventData.userId}`);

               console.log("waiting 5 seconds")
               await new Promise(resolve => setTimeout(resolve, 5000));
               console.log("Now Processing notification into database")

               const notificationModel = new Notification();

               if (eventData.eventType === 'file.uploaded.success') {
                    await notificationModel.createUploadSuccessNotification(
                         eventData.userId,
                         eventData.fileName,
                         eventData.documentId,
                         eventData.ingestionSource
                    );
                    console.log('✅ Success notification created in database');
               }

               if (eventData.eventType === 'file.uploaded.error') {
                    await notificationModel.createUploadErrorNotification(
                         eventData.userId,
                         eventData.fileName,
                         eventData.error || 'Unknown error occurred',
                         eventData.ingestionSource
                    );
                    console.log('❌ Error notification created in database');
               }

          } catch (error) {
               console.error('💥 Error processing notification event:', error);
               throw error; // Re-throw to let Service Bus handle retry logic
          }
     }
}

// Export a singleton instance
const notificationHandler = new NotificationHandler();

module.exports = {
     notificationHandler,

     // Export the handler function for Service Bus subscription
     handleFileEvents: async (eventData) => {
          return await notificationHandler.handleFileEvent(eventData);
     }
}; 