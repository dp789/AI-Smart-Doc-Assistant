# Azure Service Bus Integration Guide

## 🚀 Overview

Your notification system now supports **Real Azure Service Bus** with automatic fallback to in-memory mode!

### ✅ Current Features:

- **Auto-detection**: Tries Azure Service Bus first, falls back to memory
- **Zero code changes**: Your upload controllers work exactly the same
- **Enterprise reliability**: Messages persist in Azure cloud
- **Multi-server support**: Works across multiple server instances
- **Graceful fallback**: Never breaks even if Azure is down

---

## 🎯 How It Works

### **With Azure Service Bus (Connected):**

```
Upload Controller → Azure Service Bus Topic → All Server Instances Get Event
                                           → Database Notification Created
```

### **Without Azure Service Bus (Fallback):**

```
Upload Controller → In-Memory Events → Same Server Gets Event
                                   → Database Notification Created
```

---

## 🔧 Setup Instructions

### **Step 1: Create Azure Service Bus Namespace**

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Service Bus"
4. Click "Service Bus" and then "Create"
5. Fill in details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Namespace name**: `your-app-servicebus` (must be globally unique)
   - **Location**: Choose closest to your servers
   - **Pricing tier**:
     - **Basic**: $0.05 per million operations (good for testing)
     - **Standard**: $10/month + operations (recommended for production)
     - **Premium**: $700/month (enterprise features)

### **Step 2: Create Topic and Subscription**

1. Once namespace is created, open it
2. In left menu, click "Topics"
3. Click "+ Topic"

   - **Name**: `file-events`
   - **Max size**: 1 GB (default)
   - **Message time to live**: 14 days (default)
   - Click "Create"

4. Click on the `file-events` topic
5. Click "Subscriptions" in left menu
6. Click "+ Subscription"
   - **Name**: `notification-service`
   - **Max delivery count**: 10 (default)
   - **Lock duration**: 30 seconds (default)
   - Click "Create"

### **Step 3: Get Connection String**

1. In your Service Bus namespace, click "Shared access policies"
2. Click "RootManageSharedAccessKey"
3. Copy the "Primary Connection String"

### **Step 4: Set Environment Variable**

#### **Windows (Command Prompt):**

```cmd
set AZURE_SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
```

#### **Windows (PowerShell):**

```powershell
$env:AZURE_SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
```

#### **Linux/Mac:**

```bash
export AZURE_SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
```

#### **Or add to .env file:**

```
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key
```

### **Step 5: Restart Your Server**

```bash
cd backend
npm start
```

---

## 🧪 Testing

### **Test Current Status:**

```bash
cd backend
node test-azure-service-bus.js
```

### **Expected Output (Connected):**

```
🚌 Testing Azure Service Bus Integration...

📋 Step 1: Checking Service Bus status...
📊 Status: {
  "isConnected": true,
  "provider": "azure-service-bus",
  "topicName": "file-events"
}

✅ Azure Service Bus connected successfully!

📤 Success event result: {
  "success": true,
  "messageId": "1642594123456-0.123",
  "provider": "azure-service-bus"
}

🎉 Azure Service Bus test completed!
✅ Successfully using Azure Service Bus
🌐 Messages are persisted in Azure cloud
🔄 Multi-server support enabled
📈 Enterprise-grade reliability active
```

### **Expected Output (Fallback):**

```
⚠️ Azure Service Bus not connected!
💡 This will test the in-memory fallback mode.

📤 Success event result: {
  "success": true,
  "messageId": "1642594123456-0.123",
  "provider": "in-memory"
}

✅ In-memory fallback working correctly
💾 Messages stored locally (single server)
💡 Set AZURE_SERVICE_BUS_CONNECTION_STRING to enable Azure
```

---

## 📊 Status Monitoring

### **Check Current Status in Code:**

```javascript
const serviceBusService = require("./services/serviceBusService");
const status = serviceBusService.getStatus();
console.log("Service Bus Status:", status);
```

### **Status Response:**

```json
{
  "isConnected": true,
  "provider": "azure-service-bus",
  "topicName": "file-events",
  "subscriptionName": "notification-service",
  "sendersCount": 1,
  "receiversCount": 1,
  "memoryMessages": 0,
  "memorySubscribers": 0
}
```

---

## 💰 Cost Estimation

### **Basic Tier** ($0.05 per million operations)

- **100 uploads/day**: ~$0.00 per month
- **1,000 uploads/day**: ~$0.00 per month
- **10,000 uploads/day**: ~$0.15 per month

### **Standard Tier** ($10/month + operations)

- **Base cost**: $10/month
- **Operations**: Same as Basic pricing
- **Features**: Topics, sessions, duplicate detection
- **Recommended for production**

### **Premium Tier** ($700/month)

- **Enterprise features**: Dedicated processing, VNet integration
- **Use only for high-scale enterprise deployments**

---

## 🔧 Configuration Options

### **Environment Variables:**

```bash
# Required
AZURE_SERVICE_BUS_CONNECTION_STRING=your-connection-string

# Optional (has defaults)
SERVICE_BUS_TOPIC_NAME=file-events
SERVICE_BUS_SUBSCRIPTION_NAME=notification-service
```

### **Advanced Configuration:**

Edit `backend/config/azure-service-bus.js`:

```javascript
module.exports = {
  connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
  topicName: "file-events",
  subscriptionName: "notification-service",
  options: {
    maxConcurrentCalls: 10, // Process 10 messages at once
    autoCompleteMessages: true, // Auto-acknowledge processed messages
    maxWaitTimeInMs: 60000, // Wait 60 seconds for new messages
  },
};
```

---

## 🚨 Troubleshooting

### **Common Issues:**

#### **"Azure Service Bus not connected"**

- ✅ Check connection string is set correctly
- ✅ Verify namespace exists in Azure
- ✅ Check topic `file-events` exists
- ✅ Check subscription `notification-service` exists

#### **"Topic does not exist"**

- Create topic in Azure Portal: `file-events`
- Or use Azure CLI: `az servicebus topic create --name file-events --namespace-name your-namespace --resource-group your-rg`

#### **"Subscription does not exist"**

- Create subscription in Azure Portal: `notification-service`
- Or use Azure CLI: `az servicebus topic subscription create --name notification-service --topic-name file-events --namespace-name your-namespace --resource-group your-rg`

#### **"Authentication failed"**

- Verify connection string is complete and correct
- Check SharedAccessKey is not expired
- Ensure namespace name is correct

### **Fallback Behavior:**

If Azure Service Bus fails for any reason, the system automatically falls back to in-memory mode. Your application will continue working normally, but messages will only be processed on the same server instance.

---

## 🎯 Benefits of Azure Service Bus

### **vs In-Memory:**

| Feature          | In-Memory            | Azure Service Bus      |
| ---------------- | -------------------- | ---------------------- |
| **Multi-server** | ❌                   | ✅                     |
| **Persistence**  | ❌ (lost on restart) | ✅ (survives restarts) |
| **Reliability**  | Good                 | Enterprise             |
| **Cost**         | Free                 | ~$10/month             |
| **Setup**        | None                 | Azure setup required   |

### **Production Benefits:**

- 📈 **Scalability**: Handle millions of events
- 🛡️ **Reliability**: 99.9% uptime SLA
- 🔄 **Multi-region**: Deploy servers globally
- 📊 **Monitoring**: Azure portal analytics
- 🔐 **Security**: Enterprise-grade encryption
- 🗃️ **Dead letter queues**: Failed messages preserved
- ⏰ **Message scheduling**: Delayed notifications

---

## 🚀 Next Steps

1. **Start with fallback mode** (current setup works great)
2. **Create Azure Service Bus when you need scale**
3. **Set environment variable**
4. **Restart server**
5. **Enjoy enterprise-grade notifications!**

Your notification system is now ready for both development and enterprise production! 🎉
