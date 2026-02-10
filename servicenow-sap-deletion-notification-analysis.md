# ServiceNow-SAP Deletion Notification Analysis

## Question
When a record (specifically a draft record) is deleted in ServiceNow, is SAP being notified about the deletion, or is it only deleted from ServiceNow without notifying SAP?

## Answer (UPDATED based on KT Document - Arcade_KT.txt)

**YES, SAP IS notified when a draft record is deleted.** The deletion notification is NOT part of the approval workflow (CDN dynamic approval process v2) shown in the screenshots -- it is handled through a **separate mechanism** triggered by the Delete action in the UI banner.

Key facts:
1. **Draft records already have a SAP ID** -- SAP is contacted during submission (save-with-status API) and assigns an ID before the procurement case is created in ServiceNow
2. **On deletion, `set status` API is called with status "W"** -- this notifies SAP that the record has been deleted
3. **A `delete record` REST API validates with SAP first** -- if SAP returns an error, the record is NOT deleted from ServiceNow
4. **The approval workflow screenshots do NOT show the deletion logic** -- deletion is handled via Business Rules / UI Actions tied to the delete button, not the approval flow

---

## IMPORTANT: Correction from Initial Screenshot-Only Analysis

The initial analysis (based solely on the approval workflow screenshots) incorrectly concluded that SAP was not notified. The **approval workflow (CDN dynamic approval process v2)** only handles the approval routing -- it does NOT handle deletion. The deletion notification to SAP is implemented as a **separate mechanism** outside of that workflow.

---

## Draft Record Lifecycle

### How a Draft Record is Created (from KT, timestamps 42:21-48:02)

The submission process follows these steps:

```
User fills form and clicks Submit
    |
    v
1. Check Consistency (API call to SAP with status "C")
    |
    ├── FAILS --> Stay on form, show error. Nothing created anywhere.
    |
    └── SUCCEEDS
         |
         v
2. Save to SAP (API call with save status)
    |    SAP stores the request and returns a SAP ID (Zid)
    |    "From this moment on, this will be the link between SAP and ServiceNow"
    |
    ├── FAILS --> Stay on form. No procurement case created in ServiceNow.
    |             No orphan records. SAP ID not received.
    |
    └── SUCCEEDS (SAP ID received)
         |
         v
3. Get Approvers (API call to SAP)
    |
    ├── FAILS --> Procurement case created in DRAFT status
    |             Error logged in the record (catch error field)
    |             User sees it in their list as draft with error
    |             Approval workflow does NOT trigger (waits for "Work in progress")
    |
    └── SUCCEEDS
         |
         v
4. Procurement case created in "Work in progress" status
   Approval workflow triggers and proceeds
```

**Key insight**: Draft records are created when Step 3 (Get Approvers) fails. By that point, **Step 2 has already succeeded**, meaning **SAP already knows about the record and has assigned a SAP ID**.

### How a Draft Record is Deleted (from KT, timestamps 24:27 and 28:50)

```
User clicks "Delete" from the banner action bar
    |
    v
"delete record" REST API called --> Validates with SAP if deletion is allowed
    |
    ├── SAP returns ERROR --> Record is NOT deleted from ServiceNow
    |                         Error message displayed to user
    |
    └── SAP allows deletion
         |
         v
    "set status" API called with status "W" --> Notifies SAP of deletion
         |
         v
    Record deleted from ServiceNow
```

**SAP is notified with status "W" and the record is only deleted if SAP confirms it is allowed.**

---

## Workflow Analysis

### 1. CDN Dynamic Approval Process v2 (Main Flow)

| Step | Action | Description |
|------|--------|-------------|
| Trigger | Procurement Case Created | Case type is one of 112, 111 |
| 1 | Wait For Condition | State is "Work in progress" AND Approvers JSON is not empty |
| 2 | CDN - Json to Array.Object | Transform APPROVER JSON into iterable data structure |
| 3 | Update Procurement Case Record | Initial case update |
| 4 | For Each Item | Iterate over approver objects |
| 5-8 | Look Up User Records | Retrieve users for Business Controller, Sales Manager, GBS, Legal Entity Controller |
| 9 | Fire Event | Notification to all Approvers |
| 10 | Do the following in Parallel | Four parallel approval branches |
| 11-17 | Branch: Business Controller | CDN Approval Steps (P), rejection check, until loop |
| 18-24 | Branch: Sales Manager | CDN Approval Steps (P), rejection check, until loop |
| 25-31 | Branch: GBS | CDN Approval Steps (P), rejection check, until loop |
| 32-38 | Branch: Legal Entity Controller | CDN Approval Steps (P), rejection check, until loop |
| 39 | CDN Approval Steps (A) | Final approval action subflow |
| 40-43 | If API Error = TRUE | Close case, Send "Technical Failure" notifications to Requestor and L1 |
| 44-46 | Else (Success) | Close case, Fire Event (email to all approvers + requestor in CC) |

### 2. CDN Approval Steps (A) - Subflow

**Flow Variables:**
- `count` (Integer) - retry counter
- `api_error` (String) - error flag
- `cookie` (String) - session cookie
- `token` (String) - authentication token

**Subflow Inputs:**
- `ApprovalStatus` (String)
- `Zid` (String)
- `User` (Records)
- `PC_Record` (Record)

| Step | Action | Description |
|------|--------|-------------|
| 1 | Set Flow Variables | Initialize variables |
| 2 | Do the following (loop) | Main retry loop |
| 3 | Set Flow Variables | Reset for each iteration |
| 4 | **CDN - fetchToken** | **Outbound API call to get SAP/CDN auth token** |
| 5-7 | If HTTP status != 200 | Set error variables, add work notes with error |
| 8 | Else | Token retrieved successfully |
| 9 | **CDN - setStatus v2** | **Outbound API call to set approval status in SAP** |
| 10-12 | If HTTP status != 204 | Set error variables, add work notes with error |
| 13-14 | Else (success) | Add work notes with approver info |
| 15 | Set Flow Variables | Update count/error state |
| 16 | Wait 30 seconds | Delay before retry |
| 17 | Until condition | (API Error is FALSE AND Count < 4) OR (Count > 3) |
| 18-19 | If API Error = TRUE | Update Multiple Approval Records |
| 20 | Assign Subflow Outputs | Return results |

---

## Key Findings (Updated with KT Document Evidence)

### SAP Communication Points -- Full Picture

Based on the KT document (Arcade_KT.txt), the SAP API calls are NOT limited to the approval workflow. The full set of SAP communication points includes:

| API Call | When Used | Status Code | Purpose |
|----------|-----------|-------------|---------|
| `check data integrity` | Form submission (check button) | "C" | Validate form data with SAP |
| `header set / save` | Form submission | Save status | SAP stores request, returns SAP ID |
| `get approvers` | After save to SAP | N/A | Retrieve dynamic approver list from SAP |
| `set status` | Approval granted | Approval status | Notify SAP of individual approval |
| `set status` | All approvals complete | "O" (OK) | Notify SAP case is fully approved |
| **`set status`** | **Record deleted** | **"W"** | **Notify SAP of deletion** |
| `delete record` | Before deletion | N/A | Check with SAP if deletion is allowed |
| `fetch token` | Before any API call | N/A | Get authentication cookie + token |
| `get document number` | Scheduled job | N/A | Retrieve billing document number from SAP |
| `attachment` | After case creation | N/A | Send attachments to SAP |

### Deletion IS Handled -- But NOT in the Approval Workflow

The approval workflow screenshots only showed the approval routing logic. The **deletion notification to SAP** is implemented separately through:
1. The **"Delete" UI action** in the banner (edit/duplicate/delete actions)
2. The **`delete record` REST API** -- validates with SAP before allowing deletion
3. The **`set status` REST API with status "W"** -- notifies SAP of the deletion

### Draft Records -- SAP IS Notified

Draft records **do have a SAP ID** because:
- The save-to-SAP call succeeded (SAP assigned an ID)
- The get-approvers call failed (causing the draft status)
- Therefore SAP already knows about the record
- When deleted, SAP is notified via `set status` with "W"
- If SAP rejects the deletion, the record remains in ServiceNow

---

## Notifications That DO Exist

| Notification | Recipient | Trigger |
|-------------|-----------|---------|
| CDN - Technical Failure (Requestor) | Requestor | API error during approval process |
| CDN - Technical Failure (L1) | L1 Support | API error during approval process |
| Fire Event (step 9) | All Approvers | After approver lookup, before parallel approval |
| Fire Event (step 46) | All Approvers + Requestor in CC | After successful approval completion |

**None of these notifications are related to record deletion.**

---

## Summary of SAP Status Codes (from KT)

| Status Code | Meaning | When Sent |
|-------------|---------|-----------|
| "C" | Check / Consistency validation | When user clicks "Check" button on the form |
| Save status | Save/Create request | On form submission, SAP stores and returns SAP ID |
| Approval status | Approval decision | When each approver approves/rejects |
| "O" (OK) | Fully approved | When all approval levels are complete |
| **"W"** | **Deleted** | **When a record is deleted from ServiceNow** |

---

## KT Document Evidence (Direct Quotes)

### On deletion notifying SAP (timestamp 24:27):
> *"We have the delete so when we delete record we call the set status with W and when the procurement case is completely approved... we communicate a status OK"*

### On the delete record API (timestamp 28:50):
> *"We have the delete record that is used to check if we can cancel creditor debit note. If I delete, if I get error on the API, will not delete the record."*

### On SAP ID assignment (timestamp 43:48):
> *"Save with status... we call again this one with a different status because in this way SAP stores request and gives us an ID... from this moment on this will be the link for everything between SAP and ServiceNow"*

### On draft creation from errors (timestamp 47:05):
> *"The error scenario here is that the request will be created putting draft... draft status by definition is not triggering any workflow"*

### On error retry logic (timestamp 24:58):
> *"What happens if one of the API goes down? We try to call the same API three times... if the third time the API fails again, add a work note to the procurement case telling the user that the API is failing"*

---

## Conclusion

**SAP IS notified when a draft record is deleted in ServiceNow.** The deletion mechanism is:
1. `delete record` REST API validates with SAP that deletion is allowed
2. `set status` REST API sends status "W" to SAP to communicate the deletion
3. If the API fails, the record is NOT deleted from ServiceNow (preventing data sync issues)

This deletion logic is implemented **outside** the approval workflow (CDN dynamic approval process v2) shown in the screenshots -- it is triggered from the Delete action in the UI banner and handled via Business Rules / REST API calls.

---

## Remaining Questions

- Where exactly is the deletion logic implemented? (Business Rule, UI Action, or Client Script on the Procurement Case table?)
- Does the deletion also have retry logic (like the 3 retries + 30-second wait in the approval flow)?
- What specific error messages are displayed to the user if SAP rejects the deletion?
- Are there any edge cases where a procurement case might not have a SAP ID (e.g., if created through a different mechanism)?
