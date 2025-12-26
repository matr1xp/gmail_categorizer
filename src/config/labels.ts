export const LABEL_DEFINITIONS = {
  'Newsletter': 'Subscription updates or promotional content.',
  'Inquiry': 'Emails requesting information or responses.',
  'Invoice': 'Billing and payment-related emails.',
  'Proposal': 'Business offers or collaboration opportunities.',
  'Action Required': 'Emails demanding immediate tasks or actions.',
  'Follow-up Reminder': 'Emails prompting follow-up actions.',
  'Task': 'Emails containing actionable tasks.',
  'Personal': 'Non-work-related emails.',
  'Urgent': 'Time-sensitive or critical communications.',
  'Bank': 'Banking alerts and financial statements.',
  'Job Update': 'Recruitment or job-related communications.',
  'Spam/Junk': 'Unwanted or irrelevant bulk emails.',
  'Social/Networking': 'Notifications from social platforms.',
  'Receipt': 'Purchase confirmations and receipts.',
  'Event Invite': 'Invitations or calendar-related messages.',
  'Subscription Renewal': 'Reminders for subscription expirations.',
  'System Notification': 'Technical alerts from services or systems.'
} as const;

export type LabelName = keyof typeof LABEL_DEFINITIONS;
