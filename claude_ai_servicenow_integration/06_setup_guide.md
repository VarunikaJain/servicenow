# Claude AI ServiceNow Integration - Setup Guide

This guide explains how to implement AI-powered automation in ServiceNow using Claude AI and Flow Designer. With this integration, users can use natural language commands like "Create an incident for email server being down" and the system will automatically create the appropriate ServiceNow records.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACES                              │
├─────────────────────────────────────────────────────────────────┤
│  Service Portal    │   Virtual Agent   │   REST API   │  Flow   │
│  Chat Widget       │   Topic           │   Endpoint   │  Trigger│
└────────┬───────────┴────────┬──────────┴──────┬───────┴────┬────┘
         │                    │                  │            │
         ▼                    ▼                  ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FLOW DESIGNER FLOW                             │
│    "AI Command Processor"                                        │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 1. Receive User Input                                   │  │
│    │ 2. Call Claude AI (via Script Include)                  │  │
│    │ 3. Parse AI Response → Determine Action Type            │  │
│    │ 4. Route to appropriate Subflow                         │  │
│    │ 5. Return Result to User                                │  │
│    └─────────────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLAUDE AI HELPER                               │
│    (Script Include)                                              │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ • Build System Prompt with ServiceNow context           │  │
│    │ • Call Claude API via REST                              │  │
│    │ • Parse JSON response                                   │  │
│    │ • Execute appropriate ServiceNow action                 │  │
│    └─────────────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLAUDE AI API                                  │
│    (api.anthropic.com)                                          │
│    • Receives system prompt + user message                       │
│    • Returns structured JSON with action + data                  │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Store API Key Securely

1. Navigate to **System Properties** > **Properties**
2. Create a new property:
   - **Name**: `x_your_scope.claude_api_key`
   - **Type**: String
   - **Value**: Your Claude API key from https://console.anthropic.com/
   - **Private**: ✓ (checked)

> ⚠️ **Security Note**: Never hardcode API keys in scripts. Always use System Properties with the Private flag enabled.

## Step 2: Create the Script Include

1. Navigate to **System Definition** > **Script Includes**
2. Click **New**
3. Fill in:
   - **Name**: `ClaudeAIHelper`
   - **API Name**: `ClaudeAIHelper`
   - **Client callable**: ☐ (unchecked)
   - **Accessible from**: All application scopes
4. Paste the code from `01_script_include_claude_ai_helper.js`
5. Click **Submit**

## Step 3: Create the REST API (Optional but Recommended)

If you want to expose this via REST API:

1. Navigate to **System Web Services** > **Scripted REST APIs**
2. Click **New**
3. Fill in:
   - **Name**: Claude AI Command API
   - **API ID**: `claude_ai_command`
4. Save, then add Resources from `04_rest_api_scripted_endpoint.js`

## Step 4: Create Flow Designer Components

### 4.1 Create the Main Flow

1. Navigate to **Process Automation** > **Flow Designer**
2. Click **New** > **Flow**
3. Configure:
   - **Name**: AI Command Processor
   - **Description**: Processes natural language commands using Claude AI
   - **Run As**: System User (or appropriate service account)

### 4.2 Add Flow Trigger

Choose one of these trigger options:

**Option A: Record-Based Trigger**
- Create a custom table `x_your_scope_ai_commands` with fields:
  - `prompt` (String)
  - `user` (Reference to sys_user)
  - `status` (Choice: pending, processing, completed, failed)
  - `result` (String)
- Trigger: When record is created

**Option B: REST Trigger**
- Use the Scripted REST API created in Step 3

**Option C: Service Catalog Trigger**
- Create a catalog item with a prompt variable
- Trigger flow on catalog item request

### 4.3 Add Flow Actions

1. **Script Action - Call Claude AI**
   ```javascript
   (function execute(inputs, outputs) {
       var helper = new ClaudeAIHelper();
       var result = helper.processPrompt(inputs.user_prompt, inputs.user_id);
       
       outputs.success = result.success;
       outputs.action_type = result.record_type || 'UNKNOWN';
       outputs.result = JSON.stringify(result);
       outputs.message = result.message || result.error;
   })(inputs, outputs);
   ```

2. **Add Decision** based on `action_type`:
   - CREATE_INCIDENT → Create Incident Record
   - CREATE_CATALOG_ITEM_REQUEST → Create Catalog Request
   - CREATE_CHANGE_REQUEST → Create Change Request
   - etc.

### 4.4 Create Subflows (Optional)

For better organization, create subflows for each action type.
See `03_subflows_create_records.js` for detailed implementations.

## Step 5: Create Service Portal Widget (Optional)

For a user-friendly chat interface:

1. Navigate to **Service Portal** > **Widgets**
2. Click **New**
3. Fill in:
   - **Name**: AI Command Chat
   - **ID**: `ai_command_chat`
4. Add the code from `05_service_portal_ai_chat_widget/`:
   - Server Script
   - Client Controller
   - HTML Template
   - CSS

5. Add the widget to a Service Portal page

## Step 6: Testing

### Test with REST API

```bash
# Using curl
curl -X POST "https://your-instance.service-now.com/api/x_your_scope/claude_ai_command/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
  -d '{
    "prompt": "Create an incident for the email server being down"
  }'
```

### Test with Service Portal

1. Navigate to your Service Portal
2. Find the AI Chat widget
3. Type: "Create an incident for my laptop not turning on"
4. Verify the incident is created

### Example Prompts to Test

| Prompt | Expected Action |
|--------|-----------------|
| "Create an incident for email not working" | Creates INC with category=software |
| "I need a new laptop" | Creates catalog request |
| "Show my open incidents" | Queries incident table |
| "Create a change request for server upgrade" | Creates CHG record |
| "Report a problem with database timeouts" | Creates PRB record |

## Customization Options

### Adding New Actions

1. Add new action type to the system prompt in `_buildSystemPrompt()`
2. Create handler method in ClaudeAIHelper
3. Add case to `_parseAndExecuteAction()` switch statement
4. Optionally create subflow in Flow Designer

### Customizing Field Mappings

Edit the handler methods (e.g., `_createIncident()`) to:
- Add/remove fields
- Change default values
- Add custom business logic
- Implement validation

### Integrating with Virtual Agent

1. Create a Virtual Agent topic
2. Add a Script action that calls `ClaudeAIHelper`
3. Use topic variables for the prompt and response

## Security Considerations

1. **API Key Protection**: Store in System Properties with Private flag
2. **User Authorization**: Verify user has permission to create requested records
3. **Input Validation**: The AI helper validates input before execution
4. **Audit Trail**: All records are created with proper attribution
5. **Rate Limiting**: Consider implementing rate limits for API calls

## Troubleshooting

### Common Issues

1. **API Key Error**
   - Verify the System Property exists and has correct value
   - Check the property name matches in script

2. **Flow Not Triggering**
   - Verify flow is published and active
   - Check trigger conditions

3. **Records Not Creating**
   - Check user permissions
   - Review system logs for errors
   - Verify table/field names

4. **AI Returns Wrong Action**
   - Refine the system prompt
   - Add more examples to the prompt
   - Be more specific in user requests

### Debug Mode

Add this to ClaudeAIHelper for debugging:

```javascript
this.debug = gs.getProperty('x_your_scope.claude_debug', 'false') === 'true';

// In methods:
if (this.debug) {
    gs.info('Claude AI Debug: ' + JSON.stringify(data));
}
```

## Cost Optimization

1. **Use Claude 3 Haiku** for simple tasks (faster, cheaper)
2. **Cache common queries** to reduce API calls
3. **Implement request batching** for bulk operations
4. **Set appropriate max_tokens** based on expected response size

## Next Steps

1. Add more action types as needed
2. Implement approval workflows for sensitive actions
3. Add conversation history for context
4. Create dashboards to track AI usage
5. Implement feedback mechanism to improve prompts
