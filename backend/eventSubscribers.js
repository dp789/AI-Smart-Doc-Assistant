const serviceBusService = require('./services/serviceBusService');
const { handleFileEvents } = require('./handlers/notificationHandler');

class EventSubscribers {
     constructor() {
          console.log('🎧 Event Subscribers Manager starting...');
     }

     /**
      * Start all event subscribers
      */
     async start() {
          try {
               console.log('🚀 Starting event subscribers...');

               // Subscribe notification handler to file events
               await serviceBusService.subscribeToEvents(
                    'file-events',
                    'notification-service',
                    handleFileEvents
               );

               // Future subscribers can be added here:
               // await serviceBusService.subscribeToEvents(
               //     'file-events',
               //     'email-service',
               //     (eventData) => emailHandler.handleFileEvent(eventData)
               // );

               console.log('✅ All event subscribers started successfully!');

          } catch (error) {
               console.error('❌ Error starting event subscribers:', error);
               throw error;
          }
     }

     /**
      * Stop all subscribers (for graceful shutdown)
      */
     async stop() {
          console.log('🛑 Stopping event subscribers...');
          // Future: Add cleanup logic here
     }
}

// If this file is run directly, start the subscribers
if (require.main === module) {
     const subscribers = new EventSubscribers();
     subscribers.start().catch(console.error);
}

module.exports = new EventSubscribers(); 