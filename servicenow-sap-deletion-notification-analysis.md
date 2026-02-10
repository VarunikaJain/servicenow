# ServiceNow-SAP Deletion Notification Analysis

## Question
When a record is deleted in ServiceNow, is SAP being notified about the deletion, or is it only deleted from ServiceNow without notifying SAP?

## Answer
**SAP is NOT being notified about record deletions.** Based on the reviewed CDN dynamic approval process workflows, records are only being deleted/closed within ServiceNow without any outbound deletion callback to SAP.

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

## Key Findings

### SAP Communication Points (Existing)
The **only** outbound API calls to SAP/CDN found in these workflows are:
1. **`CDN - fetchToken`** - Authentication token retrieval
2. **`CDN - setStatus v2`** - Approval/rejection status update

Both calls are used exclusively during the **approval process**, not for deletion events.

### What is Missing
- **No deletion trigger**: There is no Business Rule, Flow, or Workflow that fires when a Procurement Case record is deleted
- **No outbound deletion API call**: No REST message or action that communicates record deletion to SAP
- **No deletion event**: No ServiceNow event is registered for record deletion that could trigger SAP notification

### Data Synchronization Gap
When a record is deleted in ServiceNow:
- ServiceNow removes/closes the record locally
- SAP retains the record in its last known state (e.g., pending approval, approved, rejected)
- This creates an **out-of-sync state** between the two systems

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

## Recommendation

To ensure SAP is notified when a record is deleted in ServiceNow, the following should be implemented:

1. **Create a deletion trigger** - A Business Rule or Flow Designer trigger that fires on record deletion from the Procurement Case table
2. **Implement an outbound REST call** - Similar to `CDN - setStatus v2`, create a REST action that sends a deletion notification to SAP (e.g., `CDN - notifyDeletion` or use `setStatus` with a "deleted" status)
3. **Add retry logic** - Follow the existing pattern with up to 4 retries and 30-second wait intervals
4. **Add error handling** - Log failures and notify L1/Requestor if the SAP deletion notification fails
5. **Consider a "soft delete" approach** - Instead of deleting records, set a status to "Deleted" and then sync that status to SAP via the existing `CDN - setStatus v2` mechanism

---

## Questions / Additional Details Needed

- What SAP endpoint should be called for deletion notifications?
- Should the deletion notification use the same `CDN - setStatus v2` action with a specific status value (e.g., "deleted"), or does SAP expose a separate deletion API?
- Are there other flows or Business Rules (not shown in the screenshots) that might handle deletion scenarios?
- Is there a specific Procurement Case table Business Rule that might already handle this at the database level?
