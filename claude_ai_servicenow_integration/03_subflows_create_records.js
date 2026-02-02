/**
 * Flow Designer Subflows for Creating Records
 * 
 * These subflows are called from the main AI Command Processor flow
 * Each subflow handles a specific record type creation
 */

// ============================================
// SUBFLOW 1: Create Incident from AI
// ============================================

/**
 * Subflow: Create Incident from AI
 * 
 * To create in ServiceNow:
 * 1. Flow Designer > New > Subflow
 * 2. Name: "Create Incident from AI"
 * 3. Add inputs and steps as described below
 */

/*
SUBFLOW INPUTS:
- action_data (String): JSON string containing incident data
- user_id (Reference: sys_user): The requesting user

SUBFLOW OUTPUTS:
- success (Boolean)
- incident_number (String)
- incident_sys_id (String)
- error_message (String)
*/

// Step 1: Parse Action Data
(function execute(inputs, outputs) {
    try {
        var data = JSON.parse(inputs.action_data);
        
        outputs.short_description = data.short_description || '';
        outputs.description = data.description || '';
        outputs.urgency = data.urgency || '3';
        outputs.impact = data.impact || '3';
        outputs.category = data.category || '';
        outputs.subcategory = data.subcategory || '';
        outputs.assignment_group_name = data.assignment_group || '';
        outputs.assigned_to_name = data.assigned_to || '';
        outputs.success = true;
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Failed to parse action data: ' + e.message;
    }
})(inputs, outputs);

// Step 2: Look up Assignment Group (if specified)
// Use "Look Up Record" action in Flow Designer
/*
Action: Look Up Record
Table: sys_user_group [sys_user_group]
Conditions: Name equals [assignment_group_name]
*/

// Step 3: Look up Assigned To (if specified)
// Use "Look Up Record" action
/*
Action: Look Up Record
Table: User [sys_user]
Conditions: User name equals [assigned_to_name]
        OR: Name equals [assigned_to_name]
*/

// Step 4: Create Incident Record
// Use "Create Record" action
/*
Action: Create Record
Table: Incident [incident]
Fields:
  - Short description: [short_description]
  - Description: [description]
  - Urgency: [urgency]
  - Impact: [impact]
  - Category: [category]
  - Subcategory: [subcategory]
  - Caller: [user_id]
  - Assignment group: [Step 2 - Record > Sys ID] (if found)
  - Assigned to: [Step 3 - Record > Sys ID] (if found)
*/

// Step 5: Set Output Variables
(function execute(inputs, outputs) {
    // inputs.incident_record comes from the Create Record step
    outputs.success = true;
    outputs.incident_number = inputs.incident_record.number;
    outputs.incident_sys_id = inputs.incident_record.sys_id;
})(inputs, outputs);


// ============================================
// SUBFLOW 2: Create Catalog Request from AI
// ============================================

/**
 * Subflow: Create Catalog Request from AI
 */

/*
SUBFLOW INPUTS:
- action_data (String): JSON string containing catalog request data
- user_id (Reference: sys_user): The requesting user

SUBFLOW OUTPUTS:
- success (Boolean)
- request_number (String)
- request_sys_id (String)
- error_message (String)
*/

// Step 1: Parse Action Data
(function execute(inputs, outputs) {
    try {
        var data = JSON.parse(inputs.action_data);
        
        outputs.cat_item_name = data.cat_item || '';
        outputs.quantity = data.quantity || 1;
        outputs.requested_for_name = data.requested_for || '';
        outputs.variables = JSON.stringify(data.variables || {});
        outputs.success = true;
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Failed to parse action data: ' + e.message;
    }
})(inputs, outputs);

// Step 2: Look up Catalog Item
/*
Action: Look Up Record
Table: Catalog Item [sc_cat_item]
Conditions: Name equals [cat_item_name]
        OR: Sys ID equals [cat_item_name]
*/

// Step 3: Look up Requested For User (if specified)
/*
Action: Look Up Record
Table: User [sys_user]
Conditions: User name equals [requested_for_name]
        OR: Name equals [requested_for_name]
*/

// Step 4: Create Service Catalog Request using Script
(function execute(inputs, outputs) {
    try {
        var catItemSysId = inputs.cat_item_sys_id;
        var requestedFor = inputs.requested_for_sys_id || inputs.user_id;
        var quantity = inputs.quantity || 1;
        var variables = {};
        
        try {
            variables = JSON.parse(inputs.variables);
        } catch (e) {
            // Use empty variables if parsing fails
        }
        
        // Use Service Catalog API
        var cart = new sn_sc.CartJS();
        
        var itemDetails = {
            sysparm_id: catItemSysId,
            sysparm_quantity: quantity,
            sysparm_requested_for: requestedFor,
            variables: variables
        };
        
        cart.addToCart(itemDetails);
        var result = cart.submitOrder();
        
        outputs.success = true;
        outputs.request_number = result.request_number;
        outputs.request_sys_id = result.request_id;
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Failed to create catalog request: ' + e.message;
    }
})(inputs, outputs);


// ============================================
// SUBFLOW 3: Create Change Request from AI
// ============================================

/**
 * Subflow: Create Change Request from AI
 */

/*
SUBFLOW INPUTS:
- action_data (String): JSON string containing change request data
- user_id (Reference: sys_user): The requesting user

SUBFLOW OUTPUTS:
- success (Boolean)
- change_number (String)
- change_sys_id (String)
- error_message (String)
*/

// Step 1: Parse Action Data
(function execute(inputs, outputs) {
    try {
        var data = JSON.parse(inputs.action_data);
        
        outputs.short_description = data.short_description || '';
        outputs.description = data.description || '';
        outputs.change_type = data.type || 'normal';
        outputs.risk = data.risk || 'moderate';
        outputs.impact = data.impact || '3';
        outputs.assignment_group_name = data.assignment_group || '';
        outputs.success = true;
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Failed to parse action data: ' + e.message;
    }
})(inputs, outputs);

// Step 2: Look up Assignment Group
/*
Action: Look Up Record
Table: sys_user_group [sys_user_group]
Conditions: Name equals [assignment_group_name]
*/

// Step 3: Create Change Request
/*
Action: Create Record
Table: Change Request [change_request]
Fields:
  - Short description: [short_description]
  - Description: [description]
  - Type: [change_type]
  - Risk: [risk]
  - Impact: [impact]
  - Requested by: [user_id]
  - Assignment group: [Step 2 - Record > Sys ID] (if found)
*/

// Step 4: Set Outputs
(function execute(inputs, outputs) {
    outputs.success = true;
    outputs.change_number = inputs.change_record.number;
    outputs.change_sys_id = inputs.change_record.sys_id;
})(inputs, outputs);


// ============================================
// SUBFLOW 4: Create Problem from AI
// ============================================

/**
 * Subflow: Create Problem from AI
 */

/*
SUBFLOW INPUTS:
- action_data (String): JSON containing problem data
- user_id (Reference: sys_user): The requesting user

SUBFLOW OUTPUTS:
- success (Boolean)
- problem_number (String)
- problem_sys_id (String)
- error_message (String)
*/

// Step 1: Parse and Create Problem
(function execute(inputs, outputs) {
    try {
        var data = JSON.parse(inputs.action_data);
        
        var gr = new GlideRecord('problem');
        gr.initialize();
        gr.setValue('short_description', data.short_description);
        gr.setValue('description', data.description);
        gr.setValue('urgency', data.urgency || '3');
        gr.setValue('impact', data.impact || '3');
        gr.setValue('category', data.category || '');
        gr.setValue('opened_by', inputs.user_id);
        
        // Look up assignment group
        if (data.assignment_group) {
            var groupGr = new GlideRecord('sys_user_group');
            if (groupGr.get('name', data.assignment_group)) {
                gr.setValue('assignment_group', groupGr.getUniqueValue());
            }
        }
        
        var sysId = gr.insert();
        
        if (sysId) {
            outputs.success = true;
            outputs.problem_number = gr.getValue('number');
            outputs.problem_sys_id = sysId;
        } else {
            outputs.success = false;
            outputs.error_message = 'Failed to insert problem record';
        }
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Error creating problem: ' + e.message;
    }
})(inputs, outputs);


// ============================================
// SUBFLOW 5: Query Records from AI
// ============================================

/**
 * Subflow: Query Records from AI
 */

/*
SUBFLOW INPUTS:
- action_data (String): JSON containing query parameters
- user_id (Reference: sys_user): The requesting user

SUBFLOW OUTPUTS:
- success (Boolean)
- record_count (Integer)
- records_json (String): JSON array of results
- error_message (String)
*/

(function execute(inputs, outputs) {
    try {
        var data = JSON.parse(inputs.action_data);
        var tableName = data.table || 'incident';
        
        var gr = new GlideRecord(tableName);
        
        // Build query from conditions
        if (data.query_conditions && data.query_conditions.length > 0) {
            data.query_conditions.forEach(function(condition) {
                var value = condition.value;
                
                // Replace CURRENT_USER placeholder
                if (value === 'CURRENT_USER') {
                    value = inputs.user_id;
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
                    case 'STARTSWITH':
                        gr.addQuery(condition.field, 'STARTSWITH', value);
                        break;
                    case 'ENDSWITH':
                        gr.addQuery(condition.field, 'ENDSWITH', value);
                        break;
                }
            });
        }
        
        // Apply ordering
        if (data.order_by) {
            if (data.order_direction === 'ASC') {
                gr.orderBy(data.order_by);
            } else {
                gr.orderByDesc(data.order_by);
            }
        }
        
        // Apply limit
        gr.setLimit(data.limit || 10);
        gr.query();
        
        var results = [];
        while (gr.next()) {
            var record = {
                sys_id: gr.getUniqueValue(),
                number: gr.getValue('number') || '',
                short_description: gr.getValue('short_description') || '',
                state: gr.getDisplayValue('state') || '',
                assigned_to: gr.getDisplayValue('assigned_to') || '',
                priority: gr.getDisplayValue('priority') || '',
                created_on: gr.getDisplayValue('sys_created_on') || '',
                updated_on: gr.getDisplayValue('sys_updated_on') || ''
            };
            results.push(record);
        }
        
        outputs.success = true;
        outputs.record_count = results.length;
        outputs.records_json = JSON.stringify(results);
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Error querying records: ' + e.message;
        outputs.record_count = 0;
        outputs.records_json = '[]';
    }
})(inputs, outputs);


// ============================================
// SUBFLOW 6: Update Record from AI
// ============================================

/**
 * Subflow: Update Record from AI
 */

/*
SUBFLOW INPUTS:
- action_data (String): JSON containing update parameters
- user_id (Reference: sys_user): The requesting user

SUBFLOW OUTPUTS:
- success (Boolean)
- record_number (String)
- record_sys_id (String)
- error_message (String)
*/

(function execute(inputs, outputs) {
    try {
        var data = JSON.parse(inputs.action_data);
        var tableName = data.table;
        
        var gr = new GlideRecord(tableName);
        var found = false;
        
        // Find the record
        if (data.sys_id) {
            found = gr.get(data.sys_id);
        } else if (data.number) {
            found = gr.get('number', data.number);
        } else if (data.query) {
            gr.addEncodedQuery(data.query);
            gr.query();
            found = gr.next();
        }
        
        if (!found) {
            outputs.success = false;
            outputs.error_message = 'Record not found';
            return;
        }
        
        // Apply updates
        var updates = data.updates || {};
        for (var field in updates) {
            if (updates.hasOwnProperty(field)) {
                var value = updates[field];
                
                // Handle reference fields
                if (field === 'assigned_to' || field === 'assignment_group') {
                    // Try to resolve by name
                    var refTable = field === 'assigned_to' ? 'sys_user' : 'sys_user_group';
                    var refGr = new GlideRecord(refTable);
                    if (refGr.get('name', value) || refGr.get('user_name', value)) {
                        value = refGr.getUniqueValue();
                    }
                }
                
                gr.setValue(field, value);
            }
        }
        
        gr.update();
        
        outputs.success = true;
        outputs.record_number = gr.getValue('number');
        outputs.record_sys_id = gr.getUniqueValue();
        
    } catch (e) {
        outputs.success = false;
        outputs.error_message = 'Error updating record: ' + e.message;
    }
})(inputs, outputs);
