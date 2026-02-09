// ============================================================================
// CATALOG CLIENT SCRIPT - CC Field Real-Time Validation (onChange)
// ============================================================================
//
// Name:        CC Email Address - Live Validation
// Applies to:  <Your Record Producer name>
// UI Type:     Both (Desktop & Mobile / Service Portal)
// Type:        onChange
// Variable:    u_cc
//
// Description:
//   Provides real-time validation feedback as the user types or modifies
//   the CC field. Shows an inline error if any address is invalid.
//   This is optional but improves user experience.
// ============================================================================

function onChange(control, oldValue, newValue, isLoading) {
    // Don't validate during initial form load
    if (isLoading || newValue === '') {
        g_form.hideFieldMsg('u_cc', true);
        return;
    }

    var emails = newValue.split(';');
    var invalidEmails = [];

    for (var i = 0; i < emails.length; i++) {
        var email = emails[i].trim();

        // Skip empty strings caused by trailing semicolons
        if (email === '') {
            continue;
        }

        // Each address must contain '@' and '.'
        if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
            invalidEmails.push(email);
        }
    }

    if (invalidEmails.length > 0) {
        g_form.showFieldMsg('u_cc',
            'Invalid email(s): ' + invalidEmails.join(', ') +
            ". Each address must contain '@' and '.'",
            'error');
    } else {
        g_form.hideFieldMsg('u_cc', true);
    }
}
