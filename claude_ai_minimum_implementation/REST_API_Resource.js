/**
 * Scripted REST API Resource (Optional - for external/portal access)
 * 
 * Setup:
 * 1. System Web Services > Scripted REST APIs > New
 * 2. Name: AI Command API, API ID: ai_command
 * 3. Create Resource: Method=POST, Path=/process
 * 4. Paste this script
 * 
 * Usage:
 * POST /api/x_your_scope/ai_command/process
 * Body: { "prompt": "Create an incident for VPN not working" }
 */

(function process(request, response) {
    var body = request.body.data;
    
    if (!body.prompt) {
        response.setStatus(400);
        return { success: false, error: 'Missing prompt' };
    }
    
    var helper = new ClaudeAIHelper();
    var result = helper.processPrompt(body.prompt, gs.getUserID());
    
    response.setStatus(result.success ? 200 : 400);
    return result;
    
})(request, response);
