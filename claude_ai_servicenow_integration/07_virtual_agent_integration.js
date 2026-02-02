/**
 * Virtual Agent Integration for Claude AI
 * 
 * This shows how to integrate Claude AI with ServiceNow Virtual Agent
 * to provide intelligent conversational capabilities
 * 
 * HOW TO SET UP:
 * 
 * 1. Navigate to Virtual Agent > Designer
 * 2. Create a new Topic or modify existing
 * 3. Add Script actions using the code below
 */

// ============================================
// OPTION 1: Simple Topic - Direct Integration
// ============================================

/**
 * Create a topic: "AI Assistant"
 * 
 * Topic Flow:
 * 1. Greeting Node → "Hi! I'm your AI assistant. What would you like to do?"
 * 2. User Input Node → Capture user request (variable: user_request)
 * 3. Script Node → Call Claude AI
 * 4. Response Node → Display result
 * 5. Loop back or end
 */

// Script Node: Process with Claude AI
(function execute() {
    var vaInputs = {};
    vaInputs.user_request = vaVars.user_request;
    vaInputs.user_sys_id = gs.getUserID();
    
    // Call Claude AI Helper
    var helper = new ClaudeAIHelper();
    var result = helper.processPrompt(vaInputs.user_request, vaInputs.user_sys_id);
    
    // Set output variables for Virtual Agent
    if (result.success) {
        vaVars.ai_success = true;
        vaVars.ai_message = result.message;
        vaVars.ai_record_number = result.number || '';
        vaVars.ai_record_type = result.record_type || '';
        vaVars.ai_record_sys_id = result.sys_id || '';
        
        // Format display message
        if (result.number) {
            vaVars.ai_display = 'I\'ve created ' + result.record_type + ' ' + 
                result.number + ' for you. Would you like me to do anything else?';
        } else if (result.records && result.records.length > 0) {
            vaVars.ai_display = 'I found ' + result.count + ' records. Here are the results:';
            vaVars.ai_records = JSON.stringify(result.records);
        } else {
            vaVars.ai_display = result.message;
        }
    } else {
        vaVars.ai_success = false;
        
        if (result.needs_clarification) {
            vaVars.ai_display = result.message;
            vaVars.needs_clarification = true;
        } else {
            vaVars.ai_display = 'I encountered an issue: ' + result.error + 
                '. Could you try rephrasing your request?';
        }
    }
})();


// ============================================
// OPTION 2: Advanced Topic with Confirmation
// ============================================

/**
 * Topic: "AI Assistant with Confirmation"
 * 
 * Flow:
 * 1. Greeting
 * 2. User Input → Capture request
 * 3. Script → Parse request (don't execute yet)
 * 4. Confirm → Show what will be created
 * 5. If confirmed → Execute
 * 6. Display result
 */

// Script Node 1: Parse Request (without executing)
(function parseRequest() {
    var helper = new ClaudeAIHelper();
    var systemPrompt = helper._buildSystemPrompt();
    var response = helper._callClaudeAPI(systemPrompt, vaVars.user_request);
    
    if (response.success) {
        try {
            var jsonMatch = response.content.match(/\{[\s\S]*\}/);
            var actionData = JSON.parse(jsonMatch[0]);
            
            vaVars.parsed_action = actionData.action;
            vaVars.parsed_table = actionData.table;
            vaVars.parsed_data = JSON.stringify(actionData.data);
            vaVars.confirmation_message = actionData.confirmation_message;
            vaVars.parse_success = true;
            
        } catch (e) {
            vaVars.parse_success = false;
            vaVars.error_message = 'Could not understand your request. Please try again.';
        }
    } else {
        vaVars.parse_success = false;
        vaVars.error_message = response.error;
    }
})();

// Script Node 2: Execute Confirmed Action
(function executeAction() {
    var helper = new ClaudeAIHelper();
    var userId = gs.getUserID();
    var data = JSON.parse(vaVars.parsed_data);
    var result;
    
    switch (vaVars.parsed_action) {
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
        default:
            result = { success: false, error: 'Unknown action' };
    }
    
    vaVars.execute_success = result.success;
    vaVars.execute_message = result.message || result.error;
    vaVars.record_number = result.number || '';
    vaVars.record_sys_id = result.sys_id || '';
})();


// ============================================
// OPTION 3: NLU-Enhanced Topic
// ============================================

/**
 * Combine ServiceNow NLU with Claude AI:
 * - Use NLU for intent detection (faster, no API cost)
 * - Use Claude AI for complex understanding and data extraction
 */

// Topic Utterances (configure in NLU):
/*
Intent: Create Incident
- I need to report an issue
- Something is broken
- Create an incident
- Log a ticket
- Report a problem with {issue}

Intent: Request Service
- I need a new {item}
- Can I get a {item}
- Request {item}
- Order {item}

Intent: Search Records
- Show me my {record_type}
- Find {record_type}
- What are my open {record_type}
*/

// Script Node: Handle based on NLU intent + Claude for details
(function handleIntent() {
    var intent = vaVars.detected_intent;
    var userMessage = vaVars.user_message;
    var userId = gs.getUserID();
    
    // For simple intents, we might not need Claude
    if (intent === 'greeting') {
        vaVars.response = 'Hello! How can I help you today?';
        return;
    }
    
    // For complex requests, use Claude to extract details
    var helper = new ClaudeAIHelper();
    
    // Customize the prompt based on detected intent
    var enhancedPrompt = userMessage;
    if (intent === 'create_incident') {
        enhancedPrompt = 'The user wants to create an incident. Their message: "' + 
            userMessage + '". Extract the relevant details and create the incident.';
    } else if (intent === 'request_service') {
        enhancedPrompt = 'The user wants to request a service or item. Their message: "' + 
            userMessage + '". Determine the catalog item and create the request.';
    }
    
    var result = helper.processPrompt(enhancedPrompt, userId);
    
    // Set response variables
    vaVars.ai_success = result.success;
    vaVars.ai_message = result.message || result.error;
    vaVars.record_number = result.number || '';
})();


// ============================================
// TOPIC CONFIGURATION EXAMPLE
// ============================================

/**
 * Complete Virtual Agent Topic Configuration
 * 
 * Topic Name: AI Assistant
 * Description: Intelligent assistant powered by Claude AI
 * 
 * Variables to create:
 * - user_request (String) - User's natural language request
 * - ai_success (True/False) - Whether the AI action succeeded
 * - ai_display (String) - Message to display to user
 * - ai_record_number (String) - Created record number
 * - ai_record_type (String) - Type of record created
 * - ai_record_sys_id (String) - Sys ID of created record
 * - ai_records (String) - JSON array of query results
 * - needs_clarification (True/False) - Whether clarification is needed
 * - parsed_action (String) - Parsed action type
 * - parsed_data (String) - Parsed action data as JSON
 * - confirmation_message (String) - Confirmation message from AI
 * - user_confirmed (True/False) - User's confirmation choice
 * 
 * Topic Flow:
 * 
 * START
 *   │
 *   ▼
 * ┌─────────────────────────────────────────────┐
 * │ Bot Says: "Hi! I'm your AI assistant.       │
 * │ I can help you create incidents, submit     │
 * │ requests, search records, and more.         │
 * │ What would you like to do?"                 │
 * └─────────────────────────────────────────────┘
 *   │
 *   ▼
 * ┌─────────────────────────────────────────────┐
 * │ User Input: Capture to 'user_request'       │
 * │ Prompt: "Please describe what you need..."  │
 * └─────────────────────────────────────────────┘
 *   │
 *   ▼
 * ┌─────────────────────────────────────────────┐
 * │ Script: Process with Claude AI              │
 * │ (Use scripts from above)                    │
 * └─────────────────────────────────────────────┘
 *   │
 *   ▼
 * ┌─────────────────────────────────────────────┐
 * │ Decision: ai_success == true?               │
 * └─────────────────────────────────────────────┘
 *   │                           │
 *   │ YES                       │ NO
 *   ▼                           ▼
 * ┌──────────────────┐    ┌──────────────────┐
 * │ Bot Says:        │    │ Bot Says:        │
 * │ "${ai_display}"  │    │ "${ai_display}"  │
 * │                  │    │ "Would you like  │
 * │ Link: View       │    │ to try again?"   │
 * │ ${record_type}   │    │                  │
 * │ ${record_number} │    │                  │
 * └──────────────────┘    └──────────────────┘
 *   │                           │
 *   ▼                           │
 * ┌──────────────────┐          │
 * │ Bot Says:        │          │
 * │ "Is there        │◄─────────┘
 * │ anything else?"  │
 * └──────────────────┘
 *   │
 *   ▼
 * ┌──────────────────┐
 * │ Yes/No Choice    │
 * └──────────────────┘
 *   │           │
 *   │ YES       │ NO
 *   │           │
 *   │           ▼
 *   │    ┌──────────────────┐
 *   │    │ Bot Says:        │
 *   │    │ "Great! Have a   │
 *   │    │ nice day!"       │
 *   │    └──────────────────┘
 *   │           │
 *   │           ▼
 *   │         END
 *   │
 *   └──────► (Loop back to User Input)
 */
