# Step 2: Create Flow

## Navigate to:
**Flow Designer → Flows → New Flow**

## Flow Details:
- **Name:** AI Command Processor
- **Description:** Processes natural language commands via Claude AI

---

# OPTION A: Trigger from Service Catalog

## 1. Create Catalog Item First

Go to **Service Catalog → Catalog Definitions → Maintain Items → New**

| Field | Value |
|-------|-------|
| Name | AI Assistant |
| Short description | Ask AI to create records |
| Catalogs | Service Catalog |

**Add Variable:**
- Name: `prompt`
- Type: Multi Line Text
- Question: "What would you like me to do?"

**Save the Catalog Item**

---

## 2. Set Flow Trigger

Back in Flow Designer, add trigger:
- **Trigger:** Service Catalog
- **Catalog Item:** AI Assistant

---

## 3. Add Action Step

Click **+ Add Action** → Search "Process AI Command" (your custom action)

**Map Inputs:**
| Action Input | Value |
|--------------|-------|
| prompt | `Trigger → Requested Item → Variables → prompt` |
| user_id | `Trigger → Requested Item → Request → Requested for` |

---

## 4. Add "Update Record" Step (Optional - to show result)

Update the Requested Item with the result:
- **Table:** Requested Item
- **Record:** `Trigger → Requested Item`
- **Fields to update:**
  - Comments: `Action → message`

---

## 5. Activate Flow

Click **Activate**

---

# OPTION B: Trigger from Custom Table

## 1. Create Custom Table

Go to **System Definition → Tables → New**

| Field | Value |
|-------|-------|
| Label | AI Commands |
| Name | u_ai_commands |
| Add module to menu | checked |

**Add Columns:**
| Column Label | Type |
|--------------|------|
| Prompt | String (1000) |
| Status | Choice (pending, processing, completed, failed) |
| Result | String (4000) |
| Record Created | String |

---

## 2. Set Flow Trigger

- **Trigger:** Record Created
- **Table:** AI Commands [u_ai_commands]

---

## 3. Add Action Step

**Map Inputs:**
| Action Input | Value |
|--------------|-------|
| prompt | `Trigger → Record → Prompt` |
| user_id | `Trigger → Record → Created by` |

---

## 4. Add "Update Record" Step

Update the AI Command record:
- **Record:** `Trigger → Record`
- **Fields:**
  - Status: `completed` (or use condition for `failed`)
  - Result: `Action → message`
  - Record Created: `Action → record_number`

---

## 5. Activate Flow

---

# OPTION C: REST API Trigger (for external calls)

## 1. Set Flow Trigger

- **Trigger:** REST
- **Method:** POST

## 2. Add Action Step

**Map Inputs:**
| Action Input | Value |
|--------------|-------|
| prompt | `Trigger → Request Body → prompt` |
| user_id | `Trigger → Request Body → user_id` |

## 3. Add Response Step

Return the action outputs back to the caller.
