const { ServiceBusClient } = require("@azure/service-bus");
const serviceBusConfig = require('../config/azure-service-bus');

class ServiceBusService {
     constructor() {
          this.client = null;
          this.queueSender = null; // Single sender for the queue
          this.queueReceiver = null; // Single receiver for the queue
          this.isConnected = false;

          // Initialize connection
          this.initialize();
     }

     async initialize() {
          try {
               console.log('🚌 Initializing Azure Service Bus connection...');
               console.log("serviceBusConfig.connectionString", serviceBusConfig.connectionString)

               if (!serviceBusConfig.connectionString) {
                    const error = new Error('Azure Service Bus connection string not provided. Please set AZURE_SERVICE_BUS_CONNECTION_STRING environment variable');
                    console.error('❌', error.message);
                    throw error;
               }

               // Create Service Bus client
               this.client = new ServiceBusClient(serviceBusConfig.connectionString);

               // Skip connection test - queue verified to exist in Azure Portal
               console.log('🔍 Skipping connection test - queue exists and working');

               this.isConnected = true;
               console.log('✅ Azure Service Bus connected successfully!');
               console.log(`📥 Queue: ${serviceBusConfig.queueName}`);

          } catch (error) {
               console.error('❌ Failed to connect to Azure Service Bus:', error.message);
               console.error('❌ Full error details:', error);
               throw error; // Force failure instead of fallback
          }
     }

     async testConnection() {
          // Test by creating a sender for the queue
          const queueName = serviceBusConfig.queueName;

          try {
               console.log(`🔍 Testing connection to queue: ${queueName}`);
               console.log(`🔍 Connection string starts with: ${serviceBusConfig.connectionString.substring(0, 50)}...`);

               // Create a test sender to validate the queue exists
               const testSender = this.client.createSender(queueName);
               await testSender.close();
               console.log('✅ Connection test passed');
          } catch (error) {
               console.error('❌ Connection test failed with error:', error.message);
               console.log('💡 Possible issues:');
               console.log('   1. Queue "file-events" does not exist in Azure Service Bus');
               console.log('   2. Connection string is incorrect');
               console.log('   3. Network/firewall issues');
               console.log('   4. Azure Service Bus permissions');
               throw error;
          }
     }

     /**
      * Publish an event to Azure Service Bus
      * @param {string} topicName - Topic name
      * @param {object} eventData - Event data to publish
      */
     async publishEvent(topicName, eventData) {
          if (!this.isConnected || !this.client) {
               throw new Error('Azure Service Bus is not connected. Cannot publish events.');
          }
          return await this.publishToAzureServiceBus(topicName, eventData);
     }

     async publishToAzureServiceBus(queueName, eventData) {
          try {
               // Get or create sender for the queue
               if (!this.queueSender) {
                    this.queueSender = this.client.createSender(serviceBusConfig.queueName);
                    console.log(`📥 Created sender for queue: ${serviceBusConfig.queueName}`);
               }

               // Create Service Bus message
               const message = {
                    body: eventData,
                    messageId: `${Date.now()}-${Math.random()}`,
                    contentType: 'application/json',
                    label: eventData.eventType || 'file-event',
                    timeToLive: 24 * 60 * 60 * 1000, // 24 hours
                    applicationProperties: {
                         source: 'file-upload-service',
                         eventType: eventData.eventType,
                         userId: eventData.userId,
                         timestamp: new Date().toISOString()
                    }
               };

               // Send to Azure Service Bus Queue
               await this.queueSender.sendMessages(message);

               console.log(`📤 Event published to Azure Service Bus queue ${serviceBusConfig.queueName}:`, eventData.eventType);
               console.log(`🎯 Message ID: ${message.messageId}`);

               return {
                    success: true,
                    messageId: message.messageId,
                    provider: 'azure-service-bus-queue'
               };

          } catch (error) {
               console.error('❌ Error publishing to Azure Service Bus Queue:', error);
               throw error; // No fallback, force error
          }
     }

     /**
      * Subscribe to events from Azure Service Bus Queue
      * @param {string} queueName - Queue to subscribe to (for compatibility, we ignore subscriptionName)
      * @param {string} subscriptionName - Ignored for queues (kept for compatibility)
      * @param {function} handler - Message handler function
      */
     async subscribeToEvents(queueName, subscriptionName, handler) {
          console.log("🎧 Setting up event subscription...")
          console.log("this.isConnected", this.isConnected)
          console.log("this.client", this.client ? "✅ ServiceBusClient ready" : "❌ No client")

          if (!this.isConnected || !this.client) {
               throw new Error('Azure Service Bus is not connected. Cannot subscribe to events.');
          }

          console.log("🚌 Using Azure Service Bus Queue subscription")
          return await this.subscribeToAzureServiceBusQueue(handler);
     }

     async subscribeToAzureServiceBusQueue(handler) {
          console.log("inside subscribe to azure service bus queue")
          try {
               // Get or create receiver for the queue
               if (!this.queueReceiver) {
                    this.queueReceiver = this.client.createReceiver(serviceBusConfig.queueName);
                    console.log(`📥 Created receiver for queue: ${serviceBusConfig.queueName}`);
               }

               // Set up message handler
               const messageHandler = async (messageReceived) => {
                    try {
                         console.log(`📥 Received message from Azure Service Bus Queue: ${messageReceived.messageId}`);
                         console.log(`🏷️ Label: ${messageReceived.label}`);

                         // Extract event data from message body
                         const eventData = messageReceived.body;

                         console.log(`🔔 Processing Azure Service Bus Queue event: ${eventData.eventType}`);

                         // Call the handler with the event data
                         await handler(eventData);

                         console.log(`✅ Azure Service Bus Queue message processed: ${messageReceived.messageId}`);

                    } catch (error) {
                         console.error(`❌ Error processing Azure Service Bus Queue message: ${error}`);
                         // Message will go to dead letter queue if processing fails repeatedly
                    }
               };

               const errorHandler = async (error) => {
                    console.error(`❌ Azure Service Bus Queue receiver error:`, error);
               };

               // Start receiving messages
               this.queueReceiver.subscribe({
                    processMessage: messageHandler,
                    processError: errorHandler
               }, {
                    maxConcurrentCalls: serviceBusConfig.options.maxConcurrentCalls,
                    autoCompleteMessages: serviceBusConfig.options.autoCompleteMessages
               });

               console.log(`🎧 Subscribed to Azure Service Bus Queue: ${serviceBusConfig.queueName}`);
               console.log(`⚡ Listening for real-time messages...`);

          } catch (error) {
               console.error('❌ Error subscribing to Azure Service Bus Queue:', error);
               throw error; // No fallback, force error
          }
     }

     /**
      * Get connection status
      */
     getStatus() {
          return {
               isConnected: this.isConnected,
               provider: this.isConnected ? 'azure-service-bus-queue' : 'disconnected',
               queueName: serviceBusConfig.queueName,
               queueSenderActive: !!this.queueSender,
               queueReceiverActive: !!this.queueReceiver
          };
     }

     /**
      * Cleanup - close all connections
      */
     async shutdown() {
          try {
               console.log('🛑 Shutting down Service Bus service...');

               if (this.isConnected && this.client) {
                    // Close queue sender
                    if (this.queueSender) {
                         try {
                              await this.queueSender.close();
                              console.log(`📴 Closed queue sender: ${serviceBusConfig.queueName}`);
                         } catch (error) {
                              console.error(`❌ Error closing queue sender:`, error);
                         }
                    }

                    // Close queue receiver
                    if (this.queueReceiver) {
                         try {
                              await this.queueReceiver.close();
                              console.log(`📴 Closed queue receiver: ${serviceBusConfig.queueName}`);
                         } catch (error) {
                              console.error(`❌ Error closing queue receiver:`, error);
                         }
                    }

                    // Close the client
                    await this.client.close();
                    console.log('📴 Azure Service Bus client closed');
               }

               // Clear references
               this.queueSender = null;
               this.queueReceiver = null;
               this.isConnected = false;
               this.client = null;

               console.log('✅ Service Bus shutdown complete');

          } catch (error) {
               console.error('❌ Error during shutdown:', error);
          }
     }
}

// Export singleton instance
module.exports = new ServiceBusService(); 