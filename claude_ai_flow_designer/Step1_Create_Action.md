# Step 1: Create Custom Action in Flow Designer

## Navigate to:
**Flow Designer → Actions → New Action**

## Action Details:
- **Name:** Process AI Command
- **Description:** Sends prompt to Claude AI and creates records automatically

---

## Add INPUTS (click "Inputs" section):

| Label | Name | Type | Mandatory |
|-------|------|------|-----------|
| User Prompt | prompt | String | Yes |
| User ID | user_id | String | Yes |

---

## Add OUTPUTS (click "Outputs" section):

| Label | Name | Type |
|-------|------|------|
| Success | success | True/False |
| Record Number | record_number | String |
| Record Sys ID | record_sys_id | String |
| Table Name | table_name | String |
| Message | message | String |
| Records JSON | records_json | String |

---

## Add Script Step:

1. Click **"+ Add Step"**
2. Select **"Script"**
3. Paste the script from Step2_Action_Script.js
4. Map the outputs

---

## Save and Publish the Action
