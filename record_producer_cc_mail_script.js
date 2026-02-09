// ============================================================================
// MAIL SCRIPT - Add Approver + CC Recipients from u_cc field
// ============================================================================
//
// Navigate to: System Notification > Email > Notification Email Scripts > New
//
// Configuration:
// ----------------
// Name:        Record Producer CC Recipients
// Active:      true
//
// This mail script is referenced by the Notification under:
//   "Who will receive" > "Additional recipients" > "Include an email script"
//
// It does two things:
//   1. Adds the approver as the primary "To" recipient
//   2. Adds all semicolon-separated emails from u_cc as CC recipients
//
// ============================================================================

(function runMailScript(current, template, email, email_action, event) {

    // ── 1. ADD THE APPROVER AS PRIMARY RECIPIENT ──
    // event.parm1 contains the approver value set in the Business Rule.
    // It may be a sys_id (of sys_user) or a direct email address.
    var approverValue = event.parm1;

    if (approverValue) {
        // Check if it looks like a sys_id (32-char hex) or an email address
        if (approverValue.indexOf('@') !== -1) {
            // Direct email address
            email.addAddress('to', approverValue);
        } else {
            // sys_id - look up the user's email
            var userGr = new GlideRecord('sys_user');
            if (userGr.get(approverValue)) {
                var approverEmail = userGr.getValue('email');
                if (approverEmail) {
                    email.addAddress('to', approverEmail, userGr.getDisplayValue('name'));
                }
            }
        }
    }

    // ── 2. ADD CC RECIPIENTS FROM u_cc FIELD ──
    // event.parm2 contains the CC email string set in the Business Rule.
    var ccField = event.parm2;

    if (ccField && ccField.trim() !== '') {
        var emails = ccField.split(';');

        for (var i = 0; i < emails.length; i++) {
            var addr = emails[i].trim();

            // Skip empty entries (e.g. from trailing semicolons)
            if (addr === '') {
                continue;
            }

            // Only add addresses that passed client-side validation (contain '@' and '.')
            if (addr.indexOf('@') !== -1 && addr.indexOf('.') !== -1) {
                email.addAddress('cc', addr);
            }
        }
    }

})(current, template, email, email_action, event);
