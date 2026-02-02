/**
 * Test Script - Run in System Definition > Scripts - Background
 * 
 * This tests the Claude AI integration directly
 */

// Test 1: Create an Incident
var helper = new ClaudeAIHelper();
var result = helper.processPrompt(
    "Create an incident because the email server is down and affecting all users", 
    gs.getUserID()
);
gs.info("Test 1 - Create Incident: " + JSON.stringify(result));

// Test 2: Query Records
var result2 = helper.processPrompt(
    "Show me my open incidents", 
    gs.getUserID()
);
gs.info("Test 2 - Query: " + JSON.stringify(result2));

// Test 3: Create Change Request
var result3 = helper.processPrompt(
    "Create a change request to upgrade the production database to version 12", 
    gs.getUserID()
);
gs.info("Test 3 - Create Change: " + JSON.stringify(result3));
