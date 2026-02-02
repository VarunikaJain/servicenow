/**
 * Custom Action Examples
 * 
 * This file shows how to extend the Claude AI integration
 * with custom actions specific to your organization
 */

// ============================================
// EXAMPLE 1: Custom Table - Employee Onboarding
// ============================================

/**
 * Add to system prompt in ClaudeAIHelper._buildSystemPrompt():
 * 
 * 10. CREATE_ONBOARDING_REQUEST
 *    - table: "x_company_onboarding_requests"
 *    - Required data fields:
 *      - employee_name: Name of new employee
 *      - start_date: When they start (YYYY-MM-DD)
 *      - department: Department name
 *      - manager: Manager's name
 *      - equipment_needed: Array of equipment items
 *      - access_needed: Array of systems/applications
 */

// Handler method to add to ClaudeAIHelper:
_createOnboardingRequest: function(data, userId) {
    var gr = new GlideRecord('x_company_onboarding_requests');
    gr.initialize();
    
    gr.setValue('employee_name', data.employee_name);
    gr.setValue('start_date', data.start_date);
    gr.setValue('requested_by', userId);
    
    // Look up department
    if (data.department) {
        var deptGr = new GlideRecord('cmn_department');
        if (deptGr.get('name', data.department)) {
            gr.setValue('department', deptGr.getUniqueValue());
        }
    }
    
    // Look up manager
    if (data.manager) {
        var mgrGr = new GlideRecord('sys_user');
        if (mgrGr.get('name', data.manager)) {
            gr.setValue('manager', mgrGr.getUniqueValue());
        }
    }
    
    // Store equipment as JSON
    if (data.equipment_needed) {
        gr.setValue('equipment_needed', JSON.stringify(data.equipment_needed));
    }
    
    // Store access needs as JSON
    if (data.access_needed) {
        gr.setValue('access_needed', JSON.stringify(data.access_needed));
    }
    
    var sysId = gr.insert();
    
    if (sysId) {
        var number = gr.getValue('number');
        return {
            success: true,
            record_type: 'Onboarding Request',
            sys_id: sysId,
            number: number,
            message: 'Onboarding Request ' + number + ' created for ' + data.employee_name
        };
    }
    
    return { success: false, error: 'Failed to create onboarding request' };
},


// ============================================
// EXAMPLE 2: Complex Action - Create Incident with Attachments
// ============================================

/**
 * Extend incident creation to support screenshots/attachments
 * mentioned in the user's request
 */

_createIncidentWithAttachments: function(data, userId) {
    // First create the incident
    var incidentResult = this._createIncident(data, userId);
    
    if (!incidentResult.success) {
        return incidentResult;
    }
    
    // If user mentioned attaching something, add a work note
    if (data.has_attachment_mention) {
        var actGr = new GlideRecord('sys_journal_field');
        actGr.initialize();
        actGr.element = 'work_notes';
        actGr.element_id = incidentResult.sys_id;
        actGr.name = 'incident';
        actGr.value = 'User mentioned they have screenshots/attachments. ' +
            'Please follow up to collect these materials.';
        actGr.insert();
        
        incidentResult.message += ' Note: Please attach any screenshots or files to the incident.';
    }
    
    return incidentResult;
},


// ============================================
// EXAMPLE 3: Intelligent Routing - Auto-assign Based on Content
// ============================================

/**
 * Automatically determine assignment group based on incident content
 */

_createIncidentWithSmartRouting: function(data, userId) {
    // Define routing rules
    var routingRules = [
        {
            keywords: ['email', 'outlook', 'exchange', 'mailbox'],
            group: 'Email Support'
        },
        {
            keywords: ['network', 'wifi', 'vpn', 'internet', 'connection'],
            group: 'Network Support'
        },
        {
            keywords: ['laptop', 'computer', 'desktop', 'hardware', 'screen', 'keyboard'],
            group: 'Hardware Support'
        },
        {
            keywords: ['password', 'login', 'access', 'locked', 'account'],
            group: 'Identity Management'
        },
        {
            keywords: ['software', 'application', 'app', 'install', 'update'],
            group: 'Software Support'
        },
        {
            keywords: ['sap', 'erp', 'oracle', 'database'],
            group: 'Enterprise Applications'
        }
    ];
    
    // Analyze the content
    var content = (data.short_description + ' ' + data.description).toLowerCase();
    
    // Find matching group
    for (var i = 0; i < routingRules.length; i++) {
        var rule = routingRules[i];
        for (var j = 0; j < rule.keywords.length; j++) {
            if (content.indexOf(rule.keywords[j]) !== -1) {
                data.assignment_group = rule.group;
                break;
            }
        }
        if (data.assignment_group) break;
    }
    
    // Default group if no match
    if (!data.assignment_group) {
        data.assignment_group = 'Service Desk';
    }
    
    return this._createIncident(data, userId);
},


// ============================================
// EXAMPLE 4: Multi-Step Action - Create Related Records
// ============================================

/**
 * Create incident and automatically create related task
 */

_createIncidentWithTask: function(data, userId) {
    // Create the incident first
    var incidentResult = this._createIncident(data, userId);
    
    if (!incidentResult.success) {
        return incidentResult;
    }
    
    // If urgency is high, create a follow-up task
    if (data.urgency == '1' || data.urgency == '2') {
        var taskGr = new GlideRecord('incident_task');
        taskGr.initialize();
        taskGr.setValue('incident', incidentResult.sys_id);
        taskGr.setValue('short_description', 'Urgent follow-up: ' + data.short_description);
        taskGr.setValue('description', 'This is an urgent incident. Please prioritize investigation.');
        taskGr.setValue('priority', data.urgency);
        
        // Assign to same group
        var incGr = new GlideRecord('incident');
        if (incGr.get(incidentResult.sys_id)) {
            taskGr.setValue('assignment_group', incGr.getValue('assignment_group'));
        }
        
        var taskSysId = taskGr.insert();
        
        if (taskSysId) {
            incidentResult.message += ' A follow-up task has also been created.';
            incidentResult.task_sys_id = taskSysId;
            incidentResult.task_number = taskGr.getValue('number');
        }
    }
    
    return incidentResult;
},


// ============================================
// EXAMPLE 5: Query Enhancement - Natural Language Search
// ============================================

/**
 * Enhanced query that understands natural language time references
 */

_queryRecordsEnhanced: function(data, userId) {
    // Parse natural language date references
    var today = new GlideDateTime();
    
    if (data.time_reference) {
        switch (data.time_reference.toLowerCase()) {
            case 'today':
                data.query_conditions.push({
                    field: 'sys_created_on',
                    operator: '>=',
                    value: today.getDate().toString()
                });
                break;
                
            case 'this week':
                var weekStart = new GlideDateTime();
                weekStart.addDaysLocalTime(-7);
                data.query_conditions.push({
                    field: 'sys_created_on',
                    operator: '>=',
                    value: weekStart.getValue()
                });
                break;
                
            case 'this month':
                var monthStart = new GlideDateTime();
                monthStart.setDayOfMonthLocalTime(1);
                data.query_conditions.push({
                    field: 'sys_created_on',
                    operator: '>=',
                    value: monthStart.getValue()
                });
                break;
                
            case 'last 24 hours':
                var yesterday = new GlideDateTime();
                yesterday.addSeconds(-86400);
                data.query_conditions.push({
                    field: 'sys_created_on',
                    operator: '>=',
                    value: yesterday.getValue()
                });
                break;
        }
    }
    
    return this._queryRecords(data, userId);
},


// ============================================
// EXAMPLE 6: Approval Request - Create with Workflow
// ============================================

/**
 * Create records that require approval
 */

_createChangeWithApproval: function(data, userId) {
    // Create the change request
    var result = this._createChangeRequest(data, userId);
    
    if (!result.success) {
        return result;
    }
    
    // If it's an emergency change, auto-approve for CAB
    if (data.type === 'emergency') {
        var changeGr = new GlideRecord('change_request');
        if (changeGr.get(result.sys_id)) {
            changeGr.setValue('state', 'assess'); // Move to assessment
            changeGr.work_notes = 'Emergency change created via AI assistant. ' +
                'Expedited review requested.';
            changeGr.update();
            
            result.message += ' This has been flagged as an emergency change.';
        }
    }
    
    return result;
},


// ============================================
// EXAMPLE 7: Bulk Operations
// ============================================

/**
 * Handle bulk operations like "close all my resolved incidents"
 */

_bulkUpdateRecords: function(data, userId) {
    var tableName = data.table;
    var gr = new GlideRecord(tableName);
    
    // Build query from conditions
    if (data.query_conditions) {
        data.query_conditions.forEach(function(condition) {
            var value = condition.value;
            if (value === 'CURRENT_USER') {
                value = userId;
            }
            gr.addQuery(condition.field, condition.operator || '=', value);
        });
    }
    
    gr.query();
    
    var updatedCount = 0;
    var failedCount = 0;
    var updates = data.updates || {};
    
    while (gr.next()) {
        try {
            for (var field in updates) {
                if (updates.hasOwnProperty(field)) {
                    gr.setValue(field, updates[field]);
                }
            }
            gr.update();
            updatedCount++;
        } catch (e) {
            failedCount++;
        }
    }
    
    return {
        success: updatedCount > 0,
        record_type: 'Bulk Update',
        updated_count: updatedCount,
        failed_count: failedCount,
        message: 'Updated ' + updatedCount + ' records' + 
            (failedCount > 0 ? ', ' + failedCount + ' failed' : '')
    };
},


// ============================================
// EXAMPLE 8: Integration with External Systems
// ============================================

/**
 * Create incident and notify external system (e.g., Slack, Teams)
 */

_createIncidentWithNotification: function(data, userId) {
    // Create the incident
    var result = this._createIncident(data, userId);
    
    if (!result.success) {
        return result;
    }
    
    // Send notification to Slack/Teams for high priority
    if (data.urgency == '1') {
        this._sendSlackNotification({
            channel: '#incident-alerts',
            text: ':rotating_light: High Priority Incident Created',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*' + result.number + '*: ' + data.short_description
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: '*Priority:* High'
                        },
                        {
                            type: 'mrkdwn',
                            text: '*Category:* ' + (data.category || 'Not specified')
                        }
                    ]
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: { type: 'plain_text', text: 'View Incident' },
                            url: gs.getProperty('glide.servlet.uri') + 
                                'incident.do?sys_id=' + result.sys_id
                        }
                    ]
                }
            ]
        });
        
        result.message += ' Team has been notified via Slack.';
    }
    
    return result;
},

_sendSlackNotification: function(payload) {
    try {
        var webhookUrl = gs.getProperty('x_company.slack_webhook_url');
        if (!webhookUrl) return;
        
        var request = new sn_ws.RESTMessageV2();
        request.setEndpoint(webhookUrl);
        request.setHttpMethod('POST');
        request.setRequestBody(JSON.stringify(payload));
        request.execute();
    } catch (e) {
        gs.error('Slack notification failed: ' + e.message);
    }
}
