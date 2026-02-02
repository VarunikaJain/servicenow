/**
 * AI Chat Widget - Client Controller
 */

api.controller = function($scope, $timeout, spUtil) {
    var c = this;
    
    // Initialize chat state
    c.messages = [];
    c.userInput = '';
    c.isLoading = false;
    c.showHelp = true;
    
    // Add welcome message
    c.messages.push({
        type: 'ai',
        content: 'Hello ' + c.data.userName + '! I\'m your AI assistant. ' +
            'I can help you create incidents, submit service requests, ' +
            'search records, and more. Just tell me what you need!',
        timestamp: new Date()
    });
    
    /**
     * Send a message to the AI
     */
    c.sendMessage = function() {
        if (!c.userInput || !c.userInput.trim() || c.isLoading) {
            return;
        }
        
        var message = c.userInput.trim();
        c.userInput = '';
        c.showHelp = false;
        
        // Add user message to chat
        c.messages.push({
            type: 'user',
            content: message,
            timestamp: new Date()
        });
        
        // Scroll to bottom
        scrollToBottom();
        
        // Show loading state
        c.isLoading = true;
        
        // Send to server
        c.server.get({
            action: 'sendMessage',
            message: message
        }).then(function(response) {
            c.isLoading = false;
            
            var aiResponse = response.data.aiResponse;
            
            // Build AI response message
            var aiMessage = {
                type: 'ai',
                content: aiResponse.displayMessage,
                timestamp: new Date(),
                success: aiResponse.success,
                recordNumber: aiResponse.number,
                recordSysId: aiResponse.sysId,
                recordType: aiResponse.type,
                recordLink: aiResponse.recordLink,
                records: aiResponse.records,
                needsClarification: aiResponse.needsClarification
            };
            
            c.messages.push(aiMessage);
            scrollToBottom();
            
        }).catch(function(error) {
            c.isLoading = false;
            console.error('Error sending message:', error);
            
            c.messages.push({
                type: 'ai',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                success: false
            });
            scrollToBottom();
        });
    };
    
    /**
     * Handle Enter key press
     */
    c.handleKeyPress = function(event) {
        if (event.keyCode === 13 && !event.shiftKey) {
            event.preventDefault();
            c.sendMessage();
        }
    };
    
    /**
     * Use an example prompt
     */
    c.useExample = function(example) {
        c.userInput = example;
        c.sendMessage();
    };
    
    /**
     * Clear chat history
     */
    c.clearChat = function() {
        c.messages = [{
            type: 'ai',
            content: 'Chat cleared. How can I help you?',
            timestamp: new Date()
        }];
        c.showHelp = true;
    };
    
    /**
     * Format timestamp for display
     */
    c.formatTime = function(date) {
        if (!date) return '';
        var d = new Date(date);
        var hours = d.getHours();
        var minutes = d.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
    };
    
    /**
     * Navigate to a record
     */
    c.openRecord = function(link) {
        if (link) {
            window.open(link, '_blank');
        }
    };
    
    /**
     * Scroll chat to bottom
     */
    function scrollToBottom() {
        $timeout(function() {
            var chatContainer = document.querySelector('.ai-chat-messages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    }
    
};
