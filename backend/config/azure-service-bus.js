// Azure Service Bus Configuration (Queue-based)
module.exports = {
     // Get this from your Azure Service Bus namespace
     connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,

     // Queue name (simpler than topic/subscription)
     queueName: process.env.SERVICE_BUS_QUEUE_NAME,

     // Service Bus options
     options: {
          // Maximum number of messages to process concurrently
          maxConcurrentCalls: 10,

          // Auto-complete messages after successful processing
          autoCompleteMessages: true,

          // Maximum time to wait for messages
          maxWaitTimeInMs: 60000
     }
}; 