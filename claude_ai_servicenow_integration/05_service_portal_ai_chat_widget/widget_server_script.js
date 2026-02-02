/**
 * AI Chat Widget - Server Script
 * 
 * This widget provides a chat interface for interacting with Claude AI
 * to create and manage ServiceNow records
 * 
 * HOW TO CREATE IN SERVICENOW:
 * 1. Navigate to Service Portal > Widgets
 * 2. Click "New"
 * 3. Name: AI Command Chat
 * 4. ID: ai_command_chat
 * 5. Copy the server script, client script, HTML template, and CSS
 */

(function() {
    // Initialize data
    data.messages = [];
    data.conversationId = gs.generateGUID();
    data.userId = gs.getUserID();
    data.userName = gs.getUserDisplayName();
    
    // Get supported actions for help
    data.supportedActions = [
        {
            name: 'Create Incident',
            icon: 'fa-exclamation-triangle',
            examples: [
                'Create an incident for email not working',
                'Report a high-priority issue with VPN',
                'My laptop is frozen and won\'t restart'
            ]
        },
        {
            name: 'Request Service',
            icon: 'fa-shopping-cart',
            examples: [
                'I need a new laptop',
                'Request software: Microsoft Office',
                'Order a new monitor'
            ]
        },
        {
            name: 'Create Change Request',
            icon: 'fa-exchange',
            examples: [
                'Create a change to upgrade the server',
                'Schedule database maintenance',
                'Request firewall rule change'
            ]
        },
        {
            name: 'Search Records',
            icon: 'fa-search',
            examples: [
                'Show my open incidents',
                'Find my pending requests',
                'List high-priority problems'
            ]
        }
    ];
    
    // Handle user input
    if (input && input.action === 'sendMessage') {
        var userMessage = input.message;
        
        if (userMessage && userMessage.trim()) {
            try {
                // Use the ClaudeAIHelper to process the message
                var helper = new ClaudeAIHelper();
                var result = helper.processPrompt(userMessage, data.userId);
                
                // Build response
                data.aiResponse = {
                    success: result.success,
                    type: result.record_type || 'Response',
                    message: result.message || result.error,
                    number: result.number,
                    sysId: result.sys_id,
                    records: result.records,
                    count: result.count,
                    needsClarification: result.needs_clarification
                };
                
                // Generate a friendly response message
                if (result.success) {
                    if (result.number) {
                        data.aiResponse.displayMessage = 'Done! I\'ve created ' + 
                            result.record_type + ' ' + result.number + '. ' +
                            'You can click the link below to view it.';
                        data.aiResponse.recordLink = '/' + getTableFromType(result.record_type) + 
                            '.do?sys_id=' + result.sys_id;
                    } else if (result.records && result.records.length > 0) {
                        data.aiResponse.displayMessage = 'I found ' + result.count + 
                            ' record(s). Here are the results:';
                    } else if (result.records && result.records.length === 0) {
                        data.aiResponse.displayMessage = 'No records found matching your query.';
                    } else {
                        data.aiResponse.displayMessage = result.message;
                    }
                } else if (result.needs_clarification) {
                    data.aiResponse.displayMessage = result.message;
                } else {
                    data.aiResponse.displayMessage = 'Sorry, I encountered an error: ' + 
                        (result.error || 'Unknown error');
                }
                
            } catch (e) {
                gs.error('AI Chat Widget Error: ' + e.message);
                data.aiResponse = {
                    success: false,
                    displayMessage: 'Sorry, I encountered an error processing your request. ' +
                        'Please try again or contact support.'
                };
            }
        }
    }
    
    // Helper function to get table name from record type
    function getTableFromType(recordType) {
        var mapping = {
            'Incident': 'incident',
            'Catalog Request': 'sc_request',
            'Change Request': 'change_request',
            'Problem': 'problem',
            'Task': 'task',
            'Knowledge Article': 'kb_knowledge'
        };
        return mapping[recordType] || 'task';
    }
    
})();
