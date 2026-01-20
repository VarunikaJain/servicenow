# ServiceNow Catalog Item Generator - NO CODE Approach

## Overview

ServiceNow provides **built-in Now Assist features** that let you create catalog items using natural language **without any coding**. This guide shows the simplest way to achieve the POC.

---

## Option 1: Now Assist for Creator (Recommended - Zero Code)

**Available in: Washington DC release and later**

### Steps:

1. **Open App Engine Studio**
   - Navigate to: `All > App Engine Studio`
   - Or type "App Engine Studio" in the navigator

2. **Click "Create App" or open existing app**

3. **Use the AI Assistant**
   - Look for the **Now Assist icon** (sparkle/magic wand) 
   - Or click **"Ask Now Assist"** button

4. **Type your request in plain English:**
   ```
   Create a catalog item called "Laptop Request" with 5 variables:
   - Employee Name (mandatory, reference to users)
   - Laptop Model (mandatory, dropdown with MacBook Pro, Dell XPS, ThinkPad)
   - Business Justification (mandatory, text area)
   - Delivery Date (date field)
   - Special Instructions (optional text)
   ```

5. **Now Assist will automatically:**
   - Create the catalog item
   - Add all variables with correct types
   - Set mandatory flags
   - Configure the form layout

6. **Review and publish**

### Screenshot Location in ServiceNow:
```
App Engine Studio > [Your App] > Click "+" > Select "Catalog Item" > Use Now Assist
```

---

## Option 2: Catalog Builder with AI Assist

**Available in: Vancouver release and later**

### Steps:

1. **Open Catalog Builder**
   - Navigate to: `All > Service Catalog > Catalog Builder`

2. **Click "Create a new catalog item"**

3. **Look for "Now Assist" or AI icon**

4. **Describe what you want:**
   ```
   I need a form for requesting new laptops. Include fields for 
   the requesting employee, laptop type selection, why they need it, 
   and when they need it by. Make the employee and reason mandatory.
   ```

5. **AI generates the catalog item**

6. **Review, adjust if needed, and save**

---

## Option 3: Flow Designer + Natural Language

**For adding workflow to catalog items**

### Steps:

1. **Open Flow Designer**
   - Navigate to: `All > Process Automation > Flow Designer`

2. **Click "New" > "Flow"**

3. **Use Now Assist:**
   - Click the sparkle icon
   - Type: "Create an approval flow for laptop requests that routes to the user's manager"

4. **AI creates the flow automatically**

5. **Attach flow to your catalog item**

---

## Option 4: Virtual Agent + Catalog Creation

**Conversational approach**

### Steps:

1. **Open Virtual Agent Designer**
   - Navigate to: `All > Virtual Agent > Designer`

2. **Create a topic for catalog item requests**

3. **Users can then chat:**
   ```
   User: "I need to create a new catalog item"
   VA: "What would you like to call it?"
   User: "Software Access Request"
   VA: "What fields do you need?"
   User: "User, application dropdown, access level, justification"
   VA: "Which fields should be mandatory?"
   User: "User and application"
   VA: "I've created the catalog item. Would you like to review it?"
   ```

---

## Quick Comparison: Coding vs No-Code

| Approach | Effort | Flexibility | Best For |
|----------|--------|-------------|----------|
| **Custom Widget (Previous POC)** | High | Very High | Complex requirements |
| **Now Assist for Creator** | Zero | High | Most use cases ✓ |
| **Catalog Builder + AI** | Zero | Medium | Simple items ✓ |
| **Flow Designer + AI** | Low | High | Workflows |

---

## Step-by-Step: Simplest POC Demo

### Prerequisites:
- ServiceNow instance (Vancouver or later)
- Now Assist enabled (check with admin)
- App Engine Studio access

### Demo Script (5 minutes):

**Step 1:** Open App Engine Studio
```
Navigator > App Engine Studio
```

**Step 2:** Create or open an app

**Step 3:** Click the Now Assist button and type:
```
Create a catalog item named "Equipment Request" with these fields:
1. Requested For - user reference, mandatory
2. Equipment Type - dropdown with Laptop, Monitor, Keyboard, Mouse, mandatory  
3. Quantity - number field, mandatory
4. Justification - text area, mandatory
5. Needed By Date - date field
6. Special Requirements - text field, optional
```

**Step 4:** Watch Now Assist create everything

**Step 5:** Review and publish

**Total time: ~2 minutes**

---

## Enabling Now Assist (If Not Already Enabled)

### Check if Now Assist is enabled:
1. Navigate to: `All > Now Assist > Administration > Settings`
2. Look for "Generative AI" toggle

### To enable (requires admin):
1. Go to: `All > Now Assist > Administration > Settings`
2. Enable "Generative AI capabilities"
3. Configure AI provider (if required)
4. Activate "Now Assist for Creator" plugin

### Required Plugins:
- `com.snc.now_assist` - Now Assist Core
- `com.snc.now_assist_creator` - Now Assist for Creator
- `sn_app_eng_studio` - App Engine Studio

---

## Sample Prompts to Try

### Basic Catalog Item:
```
Create a catalog item for requesting office supplies with fields for 
employee, item needed, quantity, and delivery location
```

### With Specific Types:
```
Create a "New Hire Equipment" catalog item with:
- New hire name (reference to sys_user, required)
- Start date (date, required)
- Department (reference to department)
- Equipment bundle (choice: Standard, Developer, Executive)
- Additional notes (multi-line text)
```

### With Workflow:
```
Create a software license request that requires manager approval 
and includes fields for the software name, number of licenses, 
cost center, and business justification
```

---

## Troubleshooting

### "Now Assist option not visible"
- Check if Now Assist plugins are activated
- Verify you have the correct roles (admin, app_engine_studio_user)
- Ensure Generative AI is enabled in settings

### "AI not understanding my request"
- Be more specific with field types
- Use terms like "dropdown", "reference", "text area"
- Specify "mandatory" or "required" explicitly

### "Created item missing fields"
- Edit the item manually to add missing fields
- Try a more detailed prompt
- Break into multiple requests if complex

---

## Benefits of No-Code Approach

1. **Speed**: Create catalog items in minutes, not hours
2. **No development skills needed**: Business users can create items
3. **Consistency**: AI follows ServiceNow best practices
4. **Iteration**: Easy to modify and regenerate
5. **Built-in**: No custom code to maintain

---

## Conclusion

For a POC, the **no-code approach using Now Assist for Creator** is the simplest and fastest method. It demonstrates the same capability (natural language → catalog item) without any custom development.

**Recommendation**: Use the built-in Now Assist features for your POC demonstration.
