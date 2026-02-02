# Step 4: Test the Workflow

## Method 1: Test with curl

Open terminal and run:

```bash
curl -X POST "https://YOUR-N8N/webhook/ai-servicenow" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create an incident for email server being down"}'
```

**Expected Response:**
```json
{
  "success": true,
  "table": "incident",
  "record_number": "INC0010001",
  "sys_id": "abc123...",
  "message": "Record created successfully"
}
```

---

## Method 2: Test in n8n UI

1. Click on **Webhook** node
2. Click **Listen for Test Event**
3. Open another browser tab and go to:
   ```
   https://YOUR-N8N/webhook-test/ai-servicenow
   ```
   (Note: `webhook-test` for testing)

4. Or use Postman/Insomnia to send POST request

---

## Test Different Prompts

### Test 1: Create Incident
```bash
curl -X POST "https://YOUR-N8N/webhook/ai-servicenow" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create incident for VPN not connecting for multiple users"}'
```

### Test 2: Create Change Request
```bash
curl -X POST "https://YOUR-N8N/webhook/ai-servicenow" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a change request to upgrade the firewall firmware"}'
```

### Test 3: Create Problem
```bash
curl -X POST "https://YOUR-N8N/webhook/ai-servicenow" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a problem for recurring database connection timeouts"}'
```

### Test 4: Create Task
```bash
curl -X POST "https://YOUR-N8N/webhook/ai-servicenow" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a task to review security patches"}'
```

---

## Verify in ServiceNow

1. Log into ServiceNow
2. Go to the respective module (e.g., **Incident → All**)
3. Find your newly created record
4. Verify the fields are populated correctly

---

## Debugging Issues

### Issue: "No JSON found in AI response"
- Check Claude node output - is it returning valid JSON?
- Try making the system prompt more strict

### Issue: "401 Unauthorized" from ServiceNow
- Verify credentials are correct
- Check user has REST API roles
- Test credentials manually with curl

### Issue: "404 Not Found" 
- Check the table name in the URL
- Verify URL format: `/api/now/table/incident`

### Issue: "400 Bad Request"
- Check field names are correct
- Verify JSON body format
- Check ServiceNow field requirements (mandatory fields)

---

## View Execution History

1. In n8n, click **Executions** (left sidebar)
2. Click on any execution to see:
   - Input/output of each node
   - Error messages
   - Timing information
