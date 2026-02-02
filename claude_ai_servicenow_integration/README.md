# Claude AI ServiceNow Integration

A comprehensive solution for integrating Claude AI with ServiceNow to enable natural language commands for creating and managing records.

## Overview

This integration allows users to interact with ServiceNow using natural language. For example:

- **"Create an incident for the email server being down"** → Creates INC0010001
- **"I need a new laptop"** → Submits a catalog request
- **"Show me my open incidents"** → Returns a list of records
- **"Create a change request to upgrade the database"** → Creates CHG0001234

## Features

- **Natural Language Processing**: Powered by Claude AI to understand user intent
- **Multiple Record Types**: Support for Incidents, Catalog Requests, Changes, Problems, Tasks, Knowledge Articles
- **Query Support**: Search records using natural language
- **Update Support**: Modify existing records
- **Multiple Interfaces**: REST API, Service Portal Widget, Virtual Agent, Flow Designer

## Files Included

| File | Description |
|------|-------------|
| `01_script_include_claude_ai_helper.js` | Main Script Include with Claude AI integration |
| `02_flow_designer_main_flow.js` | Flow Designer flow structure and script actions |
| `03_subflows_create_records.js` | Subflows for different record types |
| `04_rest_api_scripted_endpoint.js` | REST API endpoints for external access |
| `05_service_portal_ai_chat_widget/` | Service Portal chat widget (server, client, HTML, CSS) |
| `06_setup_guide.md` | Detailed setup instructions |
| `07_virtual_agent_integration.js` | Virtual Agent topic integration |
| `08_custom_actions_examples.js` | Examples for extending with custom actions |

## Quick Start

### 1. Prerequisites

- ServiceNow instance (Paris or later recommended)
- Claude API key from [Anthropic Console](https://console.anthropic.com/)
- Admin access to ServiceNow

### 2. Store API Key

```
System Properties > Create New Property
Name: x_your_scope.claude_api_key
Value: [Your Claude API Key]
Private: ✓ (checked)
```

### 3. Create Script Include

1. System Definition > Script Includes > New
2. Name: `ClaudeAIHelper`
3. Copy code from `01_script_include_claude_ai_helper.js`
4. Save

### 4. Test

```javascript
// Background script test
var helper = new ClaudeAIHelper();
var result = helper.processPrompt('Create an incident for VPN not connecting', gs.getUserID());
gs.info(JSON.stringify(result));
```

## Supported Actions

| Action | Example Prompts |
|--------|----------------|
| Create Incident | "Create an incident for email not working" |
| Create Catalog Request | "I need a new laptop", "Request software installation" |
| Create Change Request | "Create a change to upgrade the server" |
| Create Problem | "Report a problem with recurring database timeouts" |
| Create Task | "Create a task to review documentation" |
| Query Records | "Show my open incidents", "Find high-priority problems" |
| Update Records | "Update INC0010001 to high priority" |

## Architecture

```
User Input (Natural Language)
        │
        ▼
┌───────────────────┐
│   Flow Designer   │ ◄── Trigger: REST API / Catalog / Record
│   or REST API     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  ClaudeAIHelper   │ ◄── Script Include
│                   │
│ ┌───────────────┐ │
│ │ Build System  │ │
│ │ Prompt        │ │
│ └───────┬───────┘ │
│         │         │
│ ┌───────▼───────┐ │
│ │ Call Claude   │ │──────► Claude API
│ │ API           │ │◄─────  (api.anthropic.com)
│ └───────┬───────┘ │
│         │         │
│ ┌───────▼───────┐ │
│ │ Parse JSON    │ │
│ │ Response      │ │
│ └───────┬───────┘ │
│         │         │
│ ┌───────▼───────┐ │
│ │ Execute       │ │
│ │ Action        │ │
│ └───────────────┘ │
└────────┬──────────┘
         │
         ▼
   ServiceNow Record
   (INC, CHG, REQ, etc.)
```

## Security Considerations

1. **API Key Storage**: Always use System Properties with Private flag
2. **User Authorization**: Actions are performed as the requesting user
3. **Audit Trail**: All records created are attributed to the user
4. **Input Validation**: AI response is validated before execution
5. **Rate Limiting**: Consider implementing API call limits

## Customization

### Adding New Actions

1. Update system prompt in `_buildSystemPrompt()` method
2. Create handler method (e.g., `_createCustomRecord()`)
3. Add case to switch statement in `_parseAndExecuteAction()`
4. Optionally add subflow in Flow Designer

See `08_custom_actions_examples.js` for detailed examples.

### Modifying Existing Actions

Edit the handler methods to:
- Add/remove fields
- Change default values
- Add validation logic
- Implement business rules

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| API Key Error | Verify System Property exists and is correct |
| Records Not Created | Check user permissions and table access |
| Wrong Action Type | Refine system prompt or be more specific |
| Flow Not Triggering | Verify flow is published and active |

### Debug Mode

```javascript
// Enable debug logging
gs.setProperty('x_your_scope.claude_debug', 'true');
```

## Cost Optimization

- Use Claude 3 Haiku for simple tasks (faster, cheaper)
- Cache common responses
- Implement request batching for bulk operations
- Set appropriate `max_tokens` limits

## Support

For issues with:
- **ServiceNow Integration**: Review system logs and Flow Designer execution history
- **Claude API**: Check [Anthropic Documentation](https://docs.anthropic.com/)
- **This Integration**: Review the setup guide and examples

## License

This integration code is provided as-is for educational and implementation purposes.
