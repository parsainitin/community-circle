# WhastFlow - Step-by-Step Local Testing Guide

This guide will help you set up and test **WhastFlow** end-to-end on your local machine using your WhatsApp number.

---

## 📋 Prerequisites

Before starting, ensure you have the following running locally or via Docker:

1. **Node.js** (v18 or higher)
2. **MongoDB** (running on `mongodb://127.0.0.1:27017`)
3. **Redis** (running on `127.0.0.1:6379`)
4. **Evolution API** instance (Baileys WhatsApp Gateway)

> **Quick Docker Command for Dependencies (MongoDB & Redis)**:
> ```bash
> docker run -d --name whastflow-mongo -p 27017:27017 mongo:latest
> docker run -d --name whastflow-redis -p 6379:6379 redis:latest
> ```

---

## ⚙️ Step 1: Set Up Evolution API & Connect Your WhatsApp

1. Run **Evolution API** locally (via Docker or npm):
   ```bash
   docker run -d --name evolution-api \
     -p 8080:8080 \
     -e AUTHENTICATION_API_KEY=whastflow_dev_secret_key \
     atendai/evolution-api:latest
   ```

2. Create a WhatsApp instance named `whastflow_bot`:
   ```bash
   curl -X POST http://localhost:8080/instance/create \
     -H "apikey: whastflow_dev_secret_key" \
     -H "Content-Type: application/json" \
     -d '{
       "instanceName": "whastflow_bot",
       "qrcode": true,
       "integration": "WHATSAPP-BAILEYS"
     }'
   ```

3. **Scan QR Code**:
   - Open `http://localhost:8080/instance/connect/whastflow_bot` in your browser (or check Docker terminal output).
   - Open WhatsApp on your phone -> Linked Devices -> **Scan QR Code**.

---

## ⚙️ Step 2: Configure Environment & Webhook

1. Check your `.env` file inside `c:\VYANAMICS\Vyanamics-Project\WhastFlow\.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/whastflow
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   EVOLUTION_API_URL=http://localhost:8080
   EVOLUTION_API_KEY=whastflow_dev_secret_key
   EVOLUTION_INSTANCE_NAME=whastflow_bot
   BROADCAST_MIN_DELAY_MS=5000
   BROADCAST_MAX_DELAY_MS=7000
   ```

2. Configure Evolution API Webhook to point to WhastFlow:
   ```bash
   curl -X POST http://localhost:8080/webhook/set/whastflow_bot \
     -H "apikey: whastflow_dev_secret_key" \
     -H "Content-Type: application/json" \
     -d '{
       "enabled": true,
       "url": "http://localhost:3000/api/webhooks/evolution",
       "byEvents": false,
       "events": ["MESSAGES_UPSERT", "GROUPS_UPSERT"]
     }'
   ```

---

## 🚀 Step 3: Start the WhastFlow Server

In your terminal inside `c:\VYANAMICS\Vyanamics-Project\WhastFlow`:

```bash
npm run dev
```

You should see logs indicating:
- `[MongoDB] Connected successfully to mongodb://127.0.0.1:27017/whastflow`
- `[BullMQ] Outbound Broadcast Worker started with 5-7s rate limiting.`
- `[WhastFlow] Server running on http://localhost:3000`

---

## 🧪 Step 4: Test Inbound WhatsApp Group Flow

1. Create a **WhatsApp Group** with your phone or add your connected bot WhatsApp number to an existing group.
2. Send a message in the group:
   ```text
   Hello @Bot testing connection
   ```
3. Watch your `npm run dev` console output. You will see:
   ```text
   [Webhook] Received Evolution API event: MESSAGES_UPSERT
   [GroupService] Registered new group: My Test Group (1203630XXXXX@g.us) - Status: PENDING
   [Webhook] Bot query detected in group 1203630XXXXX@g.us: "Hello @Bot testing connection"
   ```

4. Verify the registered group via REST API:
   ```bash
   curl http://localhost:3000/api/groups
   ```

---

## ⚡ Step 5: Test Verification & Approval Flow

To allow outbound broadcasts to reach your group, update its status from `PENDING` to `VERIFIED`:

### Option A: Send WhatsApp Admin Command in Group
In the WhatsApp group, send:
```text
!verify
```
Console log will output:
```text
[Webhook] Group 1203630XXXXX@g.us verified via bot command by +1234567890
```

### Option B: Approve via API
```bash
curl -X PATCH http://localhost:3000/api/groups/1203630XXXXX@g.us/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "VERIFIED",
    "verifiedByUser": "+1234567890"
  }'
```

---

## 📢 Step 6: Test Outbound Event Broadcast Flow

Now trigger a `post.published` event broadcast!

Send a `POST` request to `http://localhost:3000/api/broadcast`:

```bash
curl -X POST http://localhost:3000/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Blog Post Published!",
    "content": "Check out our latest update on AI & Automation: https://example.com/blog",
    "topics": ["general"]
  }'
```

### 🎯 What Happens Next:
1. The API responds immediately with `202 Accepted` and a `broadcastId` (e.g. `bcast_1700000000_abc12`).
2. BullMQ Outbound Worker fetches all `VERIFIED` active groups.
3. The message is sent to your WhatsApp group!
4. If you have multiple verified groups, the worker pauses for **5 to 7 seconds** between each group to avoid rate limits.

---

## 📊 Step 7: Inspect Broadcast Logs

Check the status of your broadcast:

```bash
curl http://localhost:3000/api/broadcast/bcast_1700000000_abc12
```

Example Response:
```json
{
  "success": true,
  "data": {
    "broadcastId": "bcast_1700000000_abc12",
    "title": "New Blog Post Published!",
    "status": "COMPLETED",
    "totalTargetGroups": 1,
    "successfulDeliveries": 1,
    "failedDeliveries": 0,
    "deliveryDetails": [
      {
        "groupJid": "1203630XXXXX@g.us",
        "groupName": "My Test Group",
        "status": "SUCCESS",
        "deliveredAt": "2026-08-07T21:50:00.000Z"
      }
    ]
  }
}
```

---

## 💡 Troubleshooting Tips

- **Evolution API Auth**: Always verify your request includes header `-H "apikey: YOUR_KEY"`.
- **Group JID Format**: WhatsApp group IDs end with `@g.us` (e.g. `1203630XXXXXX@g.us`).
- **Webhook Connection**: If running Evolution API in Docker and WhastFlow on your host machine, use `http://host.docker.internal:3000/api/webhooks/evolution` as the webhook URL.
