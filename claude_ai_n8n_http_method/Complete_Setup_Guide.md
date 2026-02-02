# Complete n8n Setup - HTTP Method (No Anthropic Credential)

## Step 1: Start n8n

```bash
docker run -it --rm -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

Open: http://localhost:5678

---

## Step 2: Create New Workflow

1. Click **"Workflows"** (left sidebar)
2. Click **"+ Add Workflow"** or **"Create new workflow"**
3. Name it: `Claude AI ServiceNow`

---

## Step 3: Add ServiceNow Credential Only

1. Click **"Credentials"** (left sidebar)
2. Click **"+ Add Credential"**
3. Search: **"HTTP Basic Auth"**
4. Enter:
   - **Credential Name:** `ServiceNow`
   - **User:** `your_servicenow_username`
   - **Password:** `your_servicenow_password`
5. Click **"Save"**

**(We'll put Claude API key directly in the HTTP Request - no credential needed)**

---

## Step 4: Build the Workflow

### Node 1: Webhook

1. Click **"+"** to add first node
2. Search: **"Webhook"**
3. Click to add it
4. Configure:

| Setting | Value |
|---------|-------|
| HTTP Method | POST |
| Path | `ai-servicenow` |

5. Leave other settings as default

---

### Node 2: HTTP Request (Call Claude API)

1. Click **"+"** after Webhook
2. Search: **"HTTP Request"**
3. Click to add it
4. Configure **EXACTLY** as follows:

**Method:** `POST`

**URL:** 
```
https://api.anthropic.com/v1/messages
```

**Authentication:** `None` (we'll use headers instead)

**Send Headers:** Toggle ON

**Headers (click "Add Header" for each):**

| Name | Value |
|------|-------|
| `x-api-key` | `sk-ant-api03-YOUR-ACTUAL-KEY-HERE` |
| `anthropic-version` | `2023-06-01` |
| `Content-Type` | `application/json` |

**Send Body:** Toggle ON

**Body Content Type:** `JSON`

**Specify Body:** `Using JSON`

**JSON Body (paste exactly):**
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "system": "Return ONLY valid JSON: {\"action\":\"CREATE\",\"table\":\"table_name\",\"fields\":{\"field\":\"value\"}}. Tables: incident(short_description,description,urgency,impact), change_request(short_description,description,type), problem(short_description,description), task(short_description,description). Example: user says 'email down' return {\"action\":\"CREATE\",\"table\":\"incident\",\"fields\":{\"short_description\":\"Email down\",\"description\":\"Email service not working\",\"urgency\":\"2\",\"impact\":\"2\"}}",
  "messages": [
    {
      "role": "user", 
      "content": "{{ $json.body.prompt }}"
    }
  ]
}
```

---

### Node 3: Code (Parse Claude Response)

1. Click **"+"** after HTTP Request
2. Search: **"Code"**
3. Click to add it
4. Set **Language:** `JavaScript`
5. Paste this code:

```javascript
const response = $input.first().json;
const aiText = response.content[0].text;

// Extract JSON from response
const jsonMatch = aiText.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('No JSON found: ' + aiText);
}

const parsed = JSON.parse(jsonMatch[0]);

return {
  json: {
    table: parsed.table,
    fields: parsed.fields
  }
};
```

---

### Node 4: HTTP Request (Create in ServiceNow)

1. Click **"+"** after Code
2. Search: **"HTTP Request"**
3. Click to add it
4. Configure:

**Method:** `POST`

**URL:** 
```
https://YOUR-INSTANCE.service-now.com/api/now/table/{{ $json.table }}
```
⚠️ **Replace `YOUR-INSTANCE` with your actual ServiceNow instance name!**

**Authentication:** `Predefined Credential Type`

**Credential Type:** `HTTP Basic Auth`

**HTTP Basic Auth:** Select `ServiceNow` (the credential you created)

**Send Headers:** Toggle ON

**Headers:**

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

**Send Body:** Toggle ON

**Body Content Type:** `JSON`

**Specify Body:** `Using JSON`

**JSON Body:**
```
{{ $json.fields }}
```

---

### Node 5: Respond to Webhook

1. Click **"+"** after HTTP Request
2. Search: **"Respond to Webhook"**
3. Click to add it
4. Configure:

**Respond With:** `JSON`

**Response Body:**
```json
{
  "success": true,
  "table": "{{ $('Code').item.json.table }}",
  "number": "{{ $json.body.result.number }}",
  "sys_id": "{{ $json.body.result.sys_id }}"
}
```

---

## Step 5: Connect the Nodes

Your workflow should look like:

```
[Webhook] ──► [HTTP Request: Claude] ──► [Code] ──► [HTTP Request: ServiceNow] ──► [Respond]
```

Make sure all nodes are connected with arrows.

---

## Step 6: Save and Activate

1. Click **"Save"** (top right)
2. Toggle **"Active"** to ON (top right)

---

## Step 7: Get Your Webhook URL

1. Click on the **Webhook** node
2. Copy the **Production URL** (looks like):
   ```
   https://your-n8n.com/webhook/ai-servicenow
   ```
   
   Or for local testing:
   ```
   http://localhost:5678/webhook/ai-servicenow
   ```

---

## Step 8: Test It!

Open terminal and run:

```bash
curl -X POST "http://localhost:5678/webhook/ai-servicenow" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create an incident for email server is down"}'
```

**Expected Response:**
```json
{
  "success": true,
  "table": "incident",
  "number": "INC0010001",
  "sys_id": "abc123..."
}
```

---

## Troubleshooting

### Error: "Cannot read property 'content' of undefined"
- Claude API call failed
- Check your API key in the HTTP Request headers
- Make sure there are no extra spaces in the key

### Error: "401 Unauthorized" from ServiceNow
- Check ServiceNow username/password
- Verify user has REST API access

### Error: "404 Not Found"
- Check ServiceNow URL is correct
- Verify table name (incident, change_request, etc.)

### To Debug:
1. Click on any node
2. Click **"Execute Node"** to test just that node
3. Check the output panel on the right
