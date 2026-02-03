# ServiceNow MCP Server (JavaScript)

Connect Claude Desktop to ServiceNow - No Python needed!

## Setup (5 minutes)

### Step 1: Install Node.js

Download from: https://nodejs.org/

### Step 2: Download These Files

Save `server.js` and `package.json` to a folder (e.g., `C:\servicenow-mcp`)

### Step 3: Edit server.js

Open `server.js` and update these lines (around line 12):

```javascript
const CONFIG = {
  servicenow: {
    instance: 'dev313586.service-now.com',  // YOUR instance
    username: 'admin',                        // YOUR username
    password: 'your_password'                 // YOUR password
  },
```

### Step 4: Run the Server

Open terminal in the folder and run:

```bash
node server.js
```

You'll see:
```
ServiceNow MCP Server (JavaScript)
Server running on: http://localhost:9123
```

**Keep this window open!**

### Step 5: Configure Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Developer → Edit Config
3. Paste:

```json
{
  "mcpServers": {
    "servicenow": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:9123"]
    }
  }
}
```

4. Save and restart Claude Desktop

### Step 6: Use It!

In Claude Desktop, try:

- "Create an incident for email server down"
- "List my recent incidents"
- "Create a change request for server upgrade"

---

## Available Tools

| Tool | Description |
|------|-------------|
| create_incident | Create new incident |
| create_change | Create change request |
| create_problem | Create problem record |
| create_task | Create task |
| list_incidents | List recent incidents |
| get_record | Get record by sys_id |
| update_record | Update existing record |
