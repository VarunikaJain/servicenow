/**
 * Scripted REST API for Claude AI Integration
 * 
 * This creates a REST API endpoint that can be called from:
 * - Service Portal widgets
 * - External applications
 * - Virtual Agent
 * - Mobile apps
 * 
 * HOW TO CREATE IN SERVICENOW:
 * 
 * 1. Navigate to System Web Services > Scripted REST APIs
 * 2. Click "New"
 * 3. Fill in:
 *    - Name: Claude AI Command API
 *    - API ID: claude_ai_command
 *    - Active: true
 * 4. Save
 * 5. Create the resources below
 */

// ============================================
// RESOURCE 1: Process Command (POST)
// ============================================

/**
 * Resource: Process Command
 * 
 * HTTP Method: POST
 * Relative path: /process
 * 
 * Request Body:
 * {
 *   "prompt": "Create an incident for email server being down",
 *   "confirm_before_execute": false
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "action": "CREATE_INCIDENT",
 *   "result": {
 *     "number": "INC0010001",
 *     "sys_id": "abc123..."
 *   },
 *   "message": "Incident INC0010001 created successfully"
 * }
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    
    var responseBody = {};
    
    try {
        // Get request body
        var requestBody = request.body.data;
        var prompt = requestBody.prompt;
        var confirmBeforeExecute = requestBody.confirm_before_execute || false;
        
        // Validate input
        if (!prompt) {
            response.setStatus(400);
            responseBody.success = false;
            responseBody.error = 'Missing required field: prompt';
            return responseBody;
        }
        
        // Get current user
        var userId = gs.getUserID();
        
        // Process with Claude AI
        var helper = new ClaudeAIHelper();
        
        if (confirmBeforeExecute) {
            // Only parse, don't execute
            var parseResult = helper._callClaudeAPI(
                helper._buildSystemPrompt(), 
                prompt
            );
            
            if (parseResult.success) {
                var jsonMatch = parseResult.content.match(/\{[\s\S]*\}/);
                var actionData = JSON.parse(jsonMatch[0]);
                
                responseBody.success = true;
                responseBody.requires_confirmation = true;
                responseBody.action = actionData.action;
                responseBody.table = actionData.table;
                responseBody.data = actionData.data;
                responseBody.confirmation_message = actionData.confirmation_message;
            } else {
                responseBody.success = false;
                responseBody.error = parseResult.error;
            }
        } else {
            // Parse and execute
            var result = helper.processPrompt(prompt, userId);
            
            responseBody.success = result.success;
            responseBody.action = result.record_type || 'Unknown';
            
            if (result.success) {
                responseBody.result = {
                    number: result.number,
                    sys_id: result.sys_id,
                    request_number: result.request_number,
                    count: result.count,
                    records: result.records
                };
                responseBody.message = result.message;
            } else {
                responseBody.error = result.error;
                responseBody.needs_clarification = result.needs_clarification;
                responseBody.clarification_message = result.message;
            }
        }
        
        response.setStatus(200);
        
    } catch (e) {
        gs.error('Claude AI API Error: ' + e.message);
        response.setStatus(500);
        responseBody.success = false;
        responseBody.error = 'Internal server error: ' + e.message;
    }
    
    return responseBody;
    
})(request, response);


// ============================================
// RESOURCE 2: Confirm and Execute (POST)
// ============================================

/**
 * Resource: Confirm and Execute
 * 
 * HTTP Method: POST
 * Relative path: /execute
 * 
 * Used after confirm_before_execute to actually execute the action
 * 
 * Request Body:
 * {
 *   "action": "CREATE_INCIDENT",
 *   "table": "incident",
 *   "data": {
 *     "short_description": "...",
 *     "description": "..."
 *   }
 * }
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    
    var responseBody = {};
    
    try {
        var requestBody = request.body.data;
        var action = requestBody.action;
        var table = requestBody.table;
        var data = requestBody.data;
        
        if (!action || !data) {
            response.setStatus(400);
            responseBody.success = false;
            responseBody.error = 'Missing required fields: action, data';
            return responseBody;
        }
        
        var userId = gs.getUserID();
        var helper = new ClaudeAIHelper();
        var result;
        
        // Execute the appropriate action
        switch (action) {
            case 'CREATE_INCIDENT':
                result = helper._createIncident(data, userId);
                break;
            case 'CREATE_CATALOG_ITEM_REQUEST':
                result = helper._createCatalogRequest(data, userId);
                break;
            case 'CREATE_CHANGE_REQUEST':
                result = helper._createChangeRequest(data, userId);
                break;
            case 'CREATE_PROBLEM':
                result = helper._createProblem(data, userId);
                break;
            case 'CREATE_TASK':
                result = helper._createTask(data, userId);
                break;
            case 'QUERY_RECORDS':
                result = helper._queryRecords(data, userId);
                break;
            case 'UPDATE_RECORD':
                result = helper._updateRecord(data, userId);
                break;
            default:
                result = {
                    success: false,
                    error: 'Unknown action type: ' + action
                };
        }
        
        responseBody = result;
        response.setStatus(result.success ? 200 : 400);
        
    } catch (e) {
        gs.error('Claude AI Execute Error: ' + e.message);
        response.setStatus(500);
        responseBody.success = false;
        responseBody.error = 'Internal server error: ' + e.message;
    }
    
    return responseBody;
    
})(request, response);


// ============================================
// RESOURCE 3: Get Supported Actions (GET)
// ============================================

/**
 * Resource: Get Supported Actions
 * 
 * HTTP Method: GET
 * Relative path: /actions
 * 
 * Returns list of supported actions and their descriptions
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    
    var actions = [
        {
            action: 'CREATE_INCIDENT',
            description: 'Create a new incident record',
            example_prompts: [
                'Create an incident for the email server being down',
                'Report a high-priority issue with the VPN not connecting',
                'Log an incident: My laptop screen is broken'
            ]
        },
        {
            action: 'CREATE_CATALOG_ITEM_REQUEST',
            description: 'Submit a service catalog request',
            example_prompts: [
                'I need a new laptop',
                'Request software installation for Adobe Photoshop',
                'Order a standing desk for my office'
            ]
        },
        {
            action: 'CREATE_CHANGE_REQUEST',
            description: 'Create a change request',
            example_prompts: [
                'Create a change request to upgrade the database server',
                'I need to schedule a network maintenance window',
                'Submit a change for firewall rule modification'
            ]
        },
        {
            action: 'CREATE_PROBLEM',
            description: 'Create a problem record',
            example_prompts: [
                'Create a problem record for recurring database timeouts',
                'Log a problem: Multiple users experiencing login failures'
            ]
        },
        {
            action: 'CREATE_TASK',
            description: 'Create a task',
            example_prompts: [
                'Create a task to review security patches',
                'Add a task for John to complete the documentation'
            ]
        },
        {
            action: 'QUERY_RECORDS',
            description: 'Search and retrieve records',
            example_prompts: [
                'Show me my open incidents',
                'Find all high-priority problems',
                'What change requests are pending approval?'
            ]
        },
        {
            action: 'UPDATE_RECORD',
            description: 'Update an existing record',
            example_prompts: [
                'Update INC0010001 to set priority to high',
                'Assign incident INC0010002 to John Smith',
                'Close problem PRB0001234'
            ]
        }
    ];
    
    response.setStatus(200);
    return {
        success: true,
        actions: actions
    };
    
})(request, response);


// ============================================
// RESOURCE 4: Chat Interface (POST)
// ============================================

/**
 * Resource: Chat Interface
 * 
 * HTTP Method: POST
 * Relative path: /chat
 * 
 * Provides a conversational interface with context
 * 
 * Request Body:
 * {
 *   "message": "Create an incident",
 *   "conversation_id": "optional-id-for-context",
 *   "context": [] // Optional previous messages
 * }
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    
    var responseBody = {};
    
    try {
        var requestBody = request.body.data;
        var message = requestBody.message;
        var conversationId = requestBody.conversation_id || gs.generateGUID();
        var context = requestBody.context || [];
        
        if (!message) {
            response.setStatus(400);
            return { success: false, error: 'Missing required field: message' };
        }
        
        var userId = gs.getUserID();
        var helper = new ClaudeAIHelper();
        
        // Build enhanced prompt with conversation context
        var enhancedPrompt = message;
        if (context.length > 0) {
            enhancedPrompt = 'Previous conversation context:\n';
            context.forEach(function(msg) {
                enhancedPrompt += msg.role + ': ' + msg.content + '\n';
            });
            enhancedPrompt += '\nCurrent request: ' + message;
        }
        
        // Process the prompt
        var result = helper.processPrompt(enhancedPrompt, userId);
        
        responseBody.conversation_id = conversationId;
        responseBody.success = result.success;
        
        if (result.success) {
            responseBody.response = {
                type: 'action_completed',
                action: result.record_type,
                details: {
                    number: result.number,
                    sys_id: result.sys_id,
                    message: result.message
                }
            };
        } else if (result.needs_clarification) {
            responseBody.response = {
                type: 'clarification_needed',
                message: result.message
            };
        } else {
            responseBody.response = {
                type: 'error',
                message: result.error
            };
        }
        
        // Add to context for next turn
        responseBody.updated_context = context.concat([
            { role: 'user', content: message },
            { role: 'assistant', content: JSON.stringify(responseBody.response) }
        ]);
        
        response.setStatus(200);
        
    } catch (e) {
        gs.error('Claude AI Chat Error: ' + e.message);
        response.setStatus(500);
        responseBody.success = false;
        responseBody.error = 'Internal server error: ' + e.message;
    }
    
    return responseBody;
    
})(request, response);
