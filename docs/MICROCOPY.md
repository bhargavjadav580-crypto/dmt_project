# Microcopy Guidelines

Use user-friendly, plain-language terms. Avoid overly technical or clinical jargon in the UI where it does not add value for non-clinical staff.

## Terminology Mapping

| Never Use | Always Use |
| :--- | :--- |
| Create Encounter / Patient Encounter | Register Patient / Patient Visit |
| Initiate Queue Transaction | Send to Queue |
| Change Encounter Status | Move Patient |
| Disposition | Next Step |
| Submit / Proceed / Execute | Save Patient / Continue / Start Consultation |
| Terminate Encounter | Complete Visit |
| 'Validation failed', 'HTTP 422'... | Friendly plain-language messages (e.g. "Please check the required fields") |

## Error Messages
- Errors must be actionable. Tell the user what went wrong and how to fix it.
- E.g. instead of "Invalid input", use "Please enter a valid phone number".

## Confirmation Dialogs
- The primary action button must explicitly state what it does (e.g., "Cancel Visit" instead of "OK").
- Destructive actions should be highlighted in red.

## Status Labels
- Use colors semantic to the urgency or stage.
- Keep them short, usually 1 or 2 words (e.g. "Checked In", "Waiting").
