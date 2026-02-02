# Step 2: Setup Credentials in n8n

## 2.1 Add Anthropic (Claude) Credentials

1. In n8n, click **⚙️ Settings** (bottom left)
2. Click **Credentials**
3. Click **+ Add Credential**
4. Search for **"Anthropic"**
5. Click on it
6. Enter:
   - **Credential Name:** `Claude API`
   - **API Key:** `sk-ant-xxxxx` (your key)
7. Click **Save**

```
┌────────────────────────────────────────┐
│         Add Anthropic Credential        │
├────────────────────────────────────────┤
│                                        │
│  Credential Name: [Claude API       ]  │
│                                        │
│  API Key: [sk-ant-xxxxxxxxxx        ]  │
│                                        │
│              [Save] [Cancel]           │
└────────────────────────────────────────┘
```

---

## 2.2 Add ServiceNow Credentials

**Option A: Using HTTP Basic Auth (Simple)**

1. Click **+ Add Credential**
2. Search for **"HTTP Request"** → Select **"Basic Auth"**
3. Enter:
   - **Credential Name:** `ServiceNow Basic Auth`
   - **Username:** your_sn_username
   - **Password:** your_sn_password
4. Click **Save**

**Option B: Using OAuth2 (More Secure)**

1. In ServiceNow, create an OAuth Application:
   - Go to **System OAuth → Application Registry**
   - Click **New** → **Create an OAuth API endpoint**
   - Name: `n8n Integration`
   - Note the Client ID and Client Secret

2. In n8n:
   - Click **+ Add Credential**
   - Search for **"OAuth2 API"**
   - Enter:
     - Client ID: from ServiceNow
     - Client Secret: from ServiceNow
     - Authorization URL: `https://YOUR-INSTANCE.service-now.com/oauth_auth.do`
     - Token URL: `https://YOUR-INSTANCE.service-now.com/oauth_token.do`
   - Click **Connect** and authorize

---

## 2.3 Test Credentials

Create a simple test workflow:

1. Add **HTTP Request** node
2. Configure:
   - Method: GET
   - URL: `https://YOUR-INSTANCE.service-now.com/api/now/table/incident?sysparm_limit=1`
   - Authentication: Select your ServiceNow credential
   - Headers: `Accept: application/json`
3. Click **Execute Node**
4. You should see incident data

If it works, credentials are set up correctly!
