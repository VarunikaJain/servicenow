/**
 * Claude AI Helper Script Include
 * 
 * This Script Include handles communication with Claude AI API
 * and parses responses to execute ServiceNow actions
 * 
 * Usage: Create this as a Script Include in ServiceNow
 * Name: ClaudeAIHelper
 * Client Callable: false
 * Accessible from: All application scopes
 */

var ClaudeAIHelper = Class.create();
ClaudeAIHelper.prototype = {
    initialize: function() {
        // Store your API key in a System Property for security
        // Create property: x_your_scope.claude_api_key
        this.apiKey = gs.getProperty('x_your_scope.claude_api_key');
        this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-sonnet-4-20250514'; // or claude-3-haiku-20240307 for faster responses
    },

    /**
     * Send a prompt to Claude AI and get structured response for ServiceNow actions
     * @param {string} userPrompt - The natural language prompt from the user
     * @param {string} userId - The sys_id of the user making the request
     * @returns {object} - Parsed action response
     */
    processPrompt: function(userPrompt, userId) {
        var systemPrompt = this._buildSystemPrompt();
        var response = this._callClaudeAPI(systemPrompt, userPrompt);
        
        if (response.success) {
            return this._parseAndExecuteAction(response.content, userId);
        }
        
        return {
            success: false,
            error: response.error || 'Failed to process prompt'
        };
    },

    /**
     * Build the system prompt that instructs Claude on how to respond
     * This is critical for getting structured, actionable responses
     */
    _buildSystemPrompt: function() {
        return `You are a ServiceNow automation assistant. Your role is to understand user requests and return structured JSON responses that can be used to create records in ServiceNow.

IMPORTANT: You must ALWAYS respond with valid JSON in the following format:

{
    "action": "ACTION_TYPE",
    "table": "TABLE_NAME",
    "data": {
        "field_name": "field_value"
    },
    "confirmation_message": "Human readable message about what will be created"
}

SUPPORTED ACTIONS AND THEIR REQUIRED FIELDS:

1. CREATE_INCIDENT
   - table: "incident"
   - Required data fields:
     - short_description: Brief summary of the issue
     - description: Detailed description
     - urgency: 1 (High), 2 (Medium), 3 (Low)
     - impact: 1 (High), 2 (Medium), 3 (Low)
     - category: Category of incident (e.g., "software", "hardware", "network")
     - subcategory: Subcategory if applicable
     - assignment_group: Name of assignment group (optional)
     - assigned_to: User to assign to (optional)

2. CREATE_CATALOG_ITEM_REQUEST
   - table: "sc_req_item"
   - Required data fields:
     - cat_item: Name or sys_id of the catalog item
     - requested_for: User the request is for
     - variables: Object containing catalog item variables
     - quantity: Number of items requested

3. CREATE_CHANGE_REQUEST
   - table: "change_request"
   - Required data fields:
     - short_description: Brief summary
     - description: Detailed description
     - type: "normal", "standard", or "emergency"
     - risk: "high", "moderate", "low"
     - impact: 1, 2, or 3
     - assignment_group: Assignment group name

4. CREATE_PROBLEM
   - table: "problem"
   - Required data fields:
     - short_description: Brief summary
     - description: Detailed description
     - urgency: 1, 2, or 3
     - impact: 1, 2, or 3
     - category: Category
     - assignment_group: Assignment group name

5. CREATE_TASK
   - table: "task"
   - Required data fields:
     - short_description: Brief summary
     - description: Detailed description
     - assigned_to: User to assign to
     - due_date: Due date in YYYY-MM-DD format

6. CREATE_KNOWLEDGE_ARTICLE
   - table: "kb_knowledge"
   - Required data fields:
     - short_description: Article title
     - text: Article content
     - kb_knowledge_base: Knowledge base name
     - category: Article category

7. QUERY_RECORDS
   - action: "QUERY_RECORDS"
   - table: The table to query
   - data:
     - query_conditions: Array of {field, operator, value}
     - limit: Maximum records to return
     - order_by: Field to sort by

8. UPDATE_RECORD
   - action: "UPDATE_RECORD"
   - table: Table name
   - data:
     - sys_id: Record sys_id (required if known) OR
     - query: Query to find the record
     - updates: Object with field:value pairs to update

9. UNKNOWN_ACTION
   - Use this when you cannot determine what the user wants
   - Include a "clarification_needed" field explaining what information is missing

RESPONSE RULES:
1. Always extract as much information as possible from the user's request
2. Use reasonable defaults when information is missing (e.g., urgency=3 if not specified)
3. If critical information is missing, use action "UNKNOWN_ACTION" and ask for clarification
4. Always include a human-readable confirmation_message
5. Parse dates intelligently (e.g., "tomorrow", "next week", "in 3 days")
6. Recognize common ServiceNow terminology and abbreviations

EXAMPLES:

User: "Create an incident for the email server being down"
Response:
{
    "action": "CREATE_INCIDENT",
    "table": "incident",
    "data": {
        "short_description": "Email server is down",
        "description": "User reported that the email server is not functioning.",
        "urgency": "1",
        "impact": "1",
        "category": "software",
        "subcategory": "email"
    },
    "confirmation_message": "I will create a high-urgency incident for the email server being down."
}

User: "I need a new laptop"
Response:
{
    "action": "CREATE_CATALOG_ITEM_REQUEST",
    "table": "sc_req_item",
    "data": {
        "cat_item": "Standard Laptop",
        "quantity": 1,
        "variables": {
            "laptop_type": "standard"
        }
    },
    "confirmation_message": "I will create a catalog request for 1 Standard Laptop."
}

User: "What incidents are assigned to me?"
Response:
{
    "action": "QUERY_RECORDS",
    "table": "incident",
    "data": {
        "query_conditions": [
            {"field": "assigned_to", "operator": "=", "value": "CURRENT_USER"},
            {"field": "state", "operator": "!=", "value": "7"}
        ],
        "limit": 20,
        "order_by": "sys_created_on"
    },
    "confirmation_message": "I will retrieve your assigned incidents."
}`;
    },

    /**
     * Call the Claude API with the prompts
     */
    _callClaudeAPI: function(systemPrompt, userPrompt) {
        try {
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint(this.apiEndpoint);
            request.setHttpMethod('POST');
            
            // Set headers
            request.setRequestHeader('Content-Type', 'application/json');
            request.setRequestHeader('x-api-key', this.apiKey);
            request.setRequestHeader('anthropic-version', '2023-06-01');
            
            // Build request body
            var requestBody = {
                model: this.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
            };
            
            request.setRequestBody(JSON.stringify(requestBody));
            
            var response = request.execute();
            var httpStatus = response.getStatusCode();
            var responseBody = response.getBody();
            
            if (httpStatus == 200) {
                var parsedResponse = JSON.parse(responseBody);
                var content = parsedResponse.content[0].text;
                
                return {
                    success: true,
                    content: content
                };
            } else {
                gs.error('Claude API Error: ' + responseBody);
                return {
                    success: false,
                    error: 'API returned status ' + httpStatus
                };
            }
        } catch (e) {
            gs.error('Claude API Exception: ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Parse the AI response and execute the appropriate action
     */
    _parseAndExecuteAction: function(aiResponse, userId) {
        try {
            // Extract JSON from the response (in case there's extra text)
            var jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    success: false,
                    error: 'No valid JSON found in AI response'
                };
            }
            
            var actionData = JSON.parse(jsonMatch[0]);
            
            // Route to appropriate handler based on action type
            switch (actionData.action) {
                case 'CREATE_INCIDENT':
                    return this._createIncident(actionData.data, userId);
                    
                case 'CREATE_CATALOG_ITEM_REQUEST':
                    return this._createCatalogRequest(actionData.data, userId);
                    
                case 'CREATE_CHANGE_REQUEST':
                    return this._createChangeRequest(actionData.data, userId);
                    
                case 'CREATE_PROBLEM':
                    return this._createProblem(actionData.data, userId);
                    
                case 'CREATE_TASK':
                    return this._createTask(actionData.data, userId);
                    
                case 'CREATE_KNOWLEDGE_ARTICLE':
                    return this._createKnowledgeArticle(actionData.data, userId);
                    
                case 'QUERY_RECORDS':
                    return this._queryRecords(actionData.data, userId);
                    
                case 'UPDATE_RECORD':
                    return this._updateRecord(actionData.data, userId);
                    
                case 'UNKNOWN_ACTION':
                    return {
                        success: false,
                        needs_clarification: true,
                        message: actionData.clarification_needed || actionData.confirmation_message
                    };
                    
                default:
                    return {
                        success: false,
                        error: 'Unknown action type: ' + actionData.action
                    };
            }
        } catch (e) {
            gs.error('Error parsing AI response: ' + e.message);
            return {
                success: false,
                error: 'Failed to parse AI response: ' + e.message
            };
        }
    },

    /**
     * Create an incident record
     */
    _createIncident: function(data, userId) {
        var gr = new GlideRecord('incident');
        gr.initialize();
        
        gr.setValue('short_description', data.short_description);
        gr.setValue('description', data.description);
        gr.setValue('urgency', data.urgency || '3');
        gr.setValue('impact', data.impact || '3');
        gr.setValue('category', data.category || '');
        gr.setValue('subcategory', data.subcategory || '');
        gr.setValue('caller_id', userId);
        
        // Handle assignment group
        if (data.assignment_group) {
            var groupGr = new GlideRecord('sys_user_group');
            if (groupGr.get('name', data.assignment_group)) {
                gr.setValue('assignment_group', groupGr.getUniqueValue());
            }
        }
        
        // Handle assigned_to
        if (data.assigned_to) {
            var userGr = new GlideRecord('sys_user');
            if (userGr.get('user_name', data.assigned_to) || userGr.get('name', data.assigned_to)) {
                gr.setValue('assigned_to', userGr.getUniqueValue());
            }
        }
        
        var sysId = gr.insert();
        
        if (sysId) {
            var incidentNumber = gr.getValue('number');
            return {
                success: true,
                record_type: 'Incident',
                sys_id: sysId,
                number: incidentNumber,
                message: 'Incident ' + incidentNumber + ' created successfully'
            };
        }
        
        return {
            success: false,
            error: 'Failed to create incident'
        };
    },

    /**
     * Create a catalog request
     */
    _createCatalogRequest: function(data, userId) {
        // First, find the catalog item
        var catItemGr = new GlideRecord('sc_cat_item');
        var found = catItemGr.get('name', data.cat_item) || catItemGr.get('sys_id', data.cat_item);
        
        if (!found) {
            return {
                success: false,
                error: 'Catalog item not found: ' + data.cat_item
            };
        }
        
        // Use the Cart API to create the request
        var cart = new sn_sc.CartJS();
        
        var itemRequest = {
            sysparm_id: catItemGr.getUniqueValue(),
            sysparm_quantity: data.quantity || 1,
            variables: data.variables || {}
        };
        
        // If requested_for is specified, find the user
        if (data.requested_for) {
            var requestedForGr = new GlideRecord('sys_user');
            if (requestedForGr.get('user_name', data.requested_for) || 
                requestedForGr.get('name', data.requested_for)) {
                itemRequest.sysparm_requested_for = requestedForGr.getUniqueValue();
            }
        } else {
            itemRequest.sysparm_requested_for = userId;
        }
        
        try {
            var cartItem = cart.addToCart(itemRequest);
            var checkoutResult = cart.submitOrder();
            
            return {
                success: true,
                record_type: 'Catalog Request',
                request_number: checkoutResult.request_number,
                message: 'Catalog request ' + checkoutResult.request_number + ' created successfully'
            };
        } catch (e) {
            // Fallback: Create request directly
            return this._createCatalogRequestDirect(data, userId, catItemGr.getUniqueValue());
        }
    },

    /**
     * Direct catalog request creation (fallback)
     */
    _createCatalogRequestDirect: function(data, userId, catItemSysId) {
        // Create the request
        var reqGr = new GlideRecord('sc_request');
        reqGr.initialize();
        reqGr.setValue('requested_for', userId);
        var reqSysId = reqGr.insert();
        
        if (!reqSysId) {
            return { success: false, error: 'Failed to create request' };
        }
        
        // Create the requested item
        var ritGr = new GlideRecord('sc_req_item');
        ritGr.initialize();
        ritGr.setValue('request', reqSysId);
        ritGr.setValue('cat_item', catItemSysId);
        ritGr.setValue('quantity', data.quantity || 1);
        var ritSysId = ritGr.insert();
        
        if (ritSysId) {
            var reqNumber = reqGr.getValue('number');
            return {
                success: true,
                record_type: 'Catalog Request',
                sys_id: reqSysId,
                request_number: reqNumber,
                message: 'Catalog request ' + reqNumber + ' created successfully'
            };
        }
        
        return { success: false, error: 'Failed to create requested item' };
    },

    /**
     * Create a change request
     */
    _createChangeRequest: function(data, userId) {
        var gr = new GlideRecord('change_request');
        gr.initialize();
        
        gr.setValue('short_description', data.short_description);
        gr.setValue('description', data.description);
        gr.setValue('type', data.type || 'normal');
        gr.setValue('risk', data.risk || 'moderate');
        gr.setValue('impact', data.impact || '3');
        gr.setValue('requested_by', userId);
        
        if (data.assignment_group) {
            var groupGr = new GlideRecord('sys_user_group');
            if (groupGr.get('name', data.assignment_group)) {
                gr.setValue('assignment_group', groupGr.getUniqueValue());
            }
        }
        
        var sysId = gr.insert();
        
        if (sysId) {
            var changeNumber = gr.getValue('number');
            return {
                success: true,
                record_type: 'Change Request',
                sys_id: sysId,
                number: changeNumber,
                message: 'Change Request ' + changeNumber + ' created successfully'
            };
        }
        
        return { success: false, error: 'Failed to create change request' };
    },

    /**
     * Create a problem record
     */
    _createProblem: function(data, userId) {
        var gr = new GlideRecord('problem');
        gr.initialize();
        
        gr.setValue('short_description', data.short_description);
        gr.setValue('description', data.description);
        gr.setValue('urgency', data.urgency || '3');
        gr.setValue('impact', data.impact || '3');
        gr.setValue('category', data.category || '');
        gr.setValue('opened_by', userId);
        
        if (data.assignment_group) {
            var groupGr = new GlideRecord('sys_user_group');
            if (groupGr.get('name', data.assignment_group)) {
                gr.setValue('assignment_group', groupGr.getUniqueValue());
            }
        }
        
        var sysId = gr.insert();
        
        if (sysId) {
            var problemNumber = gr.getValue('number');
            return {
                success: true,
                record_type: 'Problem',
                sys_id: sysId,
                number: problemNumber,
                message: 'Problem ' + problemNumber + ' created successfully'
            };
        }
        
        return { success: false, error: 'Failed to create problem' };
    },

    /**
     * Create a task record
     */
    _createTask: function(data, userId) {
        var gr = new GlideRecord('task');
        gr.initialize();
        
        gr.setValue('short_description', data.short_description);
        gr.setValue('description', data.description);
        gr.setValue('opened_by', userId);
        
        if (data.assigned_to) {
            var userGr = new GlideRecord('sys_user');
            if (userGr.get('user_name', data.assigned_to) || userGr.get('name', data.assigned_to)) {
                gr.setValue('assigned_to', userGr.getUniqueValue());
            }
        }
        
        if (data.due_date) {
            gr.setValue('due_date', data.due_date);
        }
        
        var sysId = gr.insert();
        
        if (sysId) {
            var taskNumber = gr.getValue('number');
            return {
                success: true,
                record_type: 'Task',
                sys_id: sysId,
                number: taskNumber,
                message: 'Task ' + taskNumber + ' created successfully'
            };
        }
        
        return { success: false, error: 'Failed to create task' };
    },

    /**
     * Create a knowledge article
     */
    _createKnowledgeArticle: function(data, userId) {
        var gr = new GlideRecord('kb_knowledge');
        gr.initialize();
        
        gr.setValue('short_description', data.short_description);
        gr.setValue('text', data.text);
        gr.setValue('author', userId);
        gr.setValue('workflow_state', 'draft');
        
        if (data.kb_knowledge_base) {
            var kbGr = new GlideRecord('kb_knowledge_base');
            if (kbGr.get('title', data.kb_knowledge_base)) {
                gr.setValue('kb_knowledge_base', kbGr.getUniqueValue());
            }
        }
        
        if (data.category) {
            gr.setValue('kb_category', data.category);
        }
        
        var sysId = gr.insert();
        
        if (sysId) {
            var articleNumber = gr.getValue('number');
            return {
                success: true,
                record_type: 'Knowledge Article',
                sys_id: sysId,
                number: articleNumber,
                message: 'Knowledge Article ' + articleNumber + ' created as draft'
            };
        }
        
        return { success: false, error: 'Failed to create knowledge article' };
    },

    /**
     * Query records from a table
     */
    _queryRecords: function(data, userId) {
        var tableName = data.table || 'incident';
        var gr = new GlideRecord(tableName);
        
        // Build query from conditions
        if (data.query_conditions && data.query_conditions.length > 0) {
            data.query_conditions.forEach(function(condition) {
                var value = condition.value;
                // Replace CURRENT_USER placeholder
                if (value === 'CURRENT_USER') {
                    value = userId;
                }
                
                switch (condition.operator) {
                    case '=':
                        gr.addQuery(condition.field, value);
                        break;
                    case '!=':
                        gr.addQuery(condition.field, '!=', value);
                        break;
                    case 'CONTAINS':
                        gr.addQuery(condition.field, 'CONTAINS', value);
                        break;
                    case '>':
                        gr.addQuery(condition.field, '>', value);
                        break;
                    case '<':
                        gr.addQuery(condition.field, '<', value);
                        break;
                    case 'IN':
                        gr.addQuery(condition.field, 'IN', value);
                        break;
                }
            });
        }
        
        if (data.order_by) {
            gr.orderByDesc(data.order_by);
        }
        
        gr.setLimit(data.limit || 10);
        gr.query();
        
        var results = [];
        while (gr.next()) {
            results.push({
                sys_id: gr.getUniqueValue(),
                number: gr.getValue('number'),
                short_description: gr.getValue('short_description'),
                state: gr.getDisplayValue('state'),
                assigned_to: gr.getDisplayValue('assigned_to'),
                created_on: gr.getDisplayValue('sys_created_on')
            });
        }
        
        return {
            success: true,
            record_type: 'Query Results',
            count: results.length,
            records: results,
            message: 'Found ' + results.length + ' records'
        };
    },

    /**
     * Update an existing record
     */
    _updateRecord: function(data, userId) {
        var tableName = data.table;
        var gr = new GlideRecord(tableName);
        
        var found = false;
        if (data.sys_id) {
            found = gr.get(data.sys_id);
        } else if (data.query) {
            gr.addEncodedQuery(data.query);
            gr.query();
            found = gr.next();
        }
        
        if (!found) {
            return {
                success: false,
                error: 'Record not found'
            };
        }
        
        // Apply updates
        for (var field in data.updates) {
            if (data.updates.hasOwnProperty(field)) {
                gr.setValue(field, data.updates[field]);
            }
        }
        
        gr.update();
        
        return {
            success: true,
            record_type: 'Update',
            sys_id: gr.getUniqueValue(),
            number: gr.getValue('number'),
            message: 'Record updated successfully'
        };
    },

    type: 'ClaudeAIHelper'
};
