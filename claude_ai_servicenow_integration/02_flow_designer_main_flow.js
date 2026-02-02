/**
 * Flow Designer - AI Command Processor Flow
 * 
 * This is the main flow that processes AI commands
 * 
 * HOW TO CREATE THIS FLOW IN SERVICENOW:
 * 
 * 1. Navigate to Flow Designer (Process Automation > Flow Designer)
 * 2. Click "New" > "Flow"
 * 3. Name: "AI Command Processor"
 * 4. Description: "Processes natural language commands using Claude AI"
 * 
 * TRIGGER OPTIONS:
 * - Record Created (on a custom AI Command table)
 * - REST API Trigger (for direct API calls)
 * - Service Portal Widget (for chat interface)
 * - Virtual Agent Topic (for conversational AI)
 */

// ============================================
// FLOW STRUCTURE
// ============================================

/*
FLOW: AI Command Processor

TRIGGER: 
  - Type: Service Catalog (when using from portal)
  - OR: Record Created on x_your_scope_ai_commands table
  - OR: REST API Trigger

INPUTS:
  - user_prompt (String): The natural language command
  - user_id (Reference: sys_user): The user making the request

ACTIONS:

1. [Script Action] Call Claude AI
   - Inputs: user_prompt, user_id
   - Script: (see below)
   - Outputs: ai_response, action_type, success

2. [Decision] Check Action Type
   - Condition: action_type equals "CREATE_INCIDENT"
     → Go to Step 3a
   - Condition: action_type equals "CREATE_CATALOG_ITEM_REQUEST"  
     → Go to Step 3b
   - Condition: action_type equals "CREATE_CHANGE_REQUEST"
     → Go to Step 3c
   - Condition: action_type equals "QUERY_RECORDS"
     → Go to Step 3d
   - Default:
     → Go to Step 4

3a. [Subflow] Create Incident from AI
3b. [Subflow] Create Catalog Request from AI
3c. [Subflow] Create Change Request from AI
3d. [Subflow] Query Records from AI

4. [Script Action] Format Response
   - Format the response for display to user

5. [Action] Send Notification/Response
   - Send result back to user

*/

// ============================================
// STEP 1: SCRIPT ACTION - Call Claude AI
// ============================================

/**
 * Flow Designer Script Action: Call Claude AI
 * 
 * Create this as a custom action in Flow Designer:
 * 1. Go to Flow Designer > Actions
 * 2. Click "New" > "Action"
 * 3. Name: "Call Claude AI"
 */

// Action Inputs:
// - user_prompt (String, Required)
// - user_id (String, Required) 

// Action Outputs:
// - success (Boolean)
// - action_type (String)
// - action_data (String - JSON)
// - confirmation_message (String)
// - error_message (String)

// Script Step within the Action:
(function execute(inputs, outputs) {
    var helper = new ClaudeAIHelper();
    var result = helper.processPrompt(inputs.user_prompt, inputs.user_id);
    
    outputs.success = result.success;
    outputs.action_type = result.action_type || 'UNKNOWN';
    outputs.action_data = JSON.stringify(result);
    outputs.confirmation_message = result.message || '';
    outputs.error_message = result.error || '';
    
    // If the action was already executed by the helper, pass the result
    if (result.number) {
        outputs.record_number = result.number;
        outputs.record_sys_id = result.sys_id;
    }
    
})(inputs, outputs);


// ============================================
// ALTERNATIVE APPROACH: Flow Designer with Subflows
// ============================================

/**
 * If you want more control and visibility in Flow Designer,
 * you can use this approach that parses the AI response
 * and routes to specific subflows
 */

// Step 1: Script to Parse AI Response (doesn't execute, just parses)
(function execute(inputs, outputs) {
    // Get the AI response
    var aiHelper = new ClaudeAIHelper();
    
    // Build request to Claude
    var systemPrompt = aiHelper._buildSystemPrompt();
    var response = aiHelper._callClaudeAPI(systemPrompt, inputs.user_prompt);
    
    if (!response.success) {
        outputs.success = false;
        outputs.error_message = response.error;
        return;
    }
    
    // Parse the JSON response
    try {
        var jsonMatch = response.content.match(/\{[\s\S]*\}/);
        var actionData = JSON.parse(jsonMatch[0]);
        
        outputs.success = true;
        outputs.action_type = actionData.action;
        outputs.table_name = actionData.table;
        outputs.action_data = JSON.stringify(actionData.data);
        outputs.confirmation_message = actionData.confirmation_message;
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Failed to parse AI response: ' + e.message;
    }
    
})(inputs, outputs);

// Step 2: Flow Decision based on action_type
// (This is configured visually in Flow Designer)

/*
Decision Configuration:

Condition 1:
  - If: action_type equals "CREATE_INCIDENT"
  - Then: Go to "Create Incident Subflow"

Condition 2:
  - If: action_type equals "CREATE_CATALOG_ITEM_REQUEST"
  - Then: Go to "Create Catalog Request Subflow"

Condition 3:
  - If: action_type equals "CREATE_CHANGE_REQUEST"
  - Then: Go to "Create Change Request Subflow"

Condition 4:
  - If: action_type equals "CREATE_PROBLEM"
  - Then: Go to "Create Problem Subflow"

Condition 5:
  - If: action_type equals "QUERY_RECORDS"
  - Then: Go to "Query Records Subflow"

Default:
  - Go to "Handle Unknown Action"
*/
