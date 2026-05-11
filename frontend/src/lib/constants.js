// Must mirror backend `services/validation.py` enum sets.
export const PROJECT_CATEGORIES = [
  'Education', 'Healthcare', 'Operations', 'R&D', 'Outreach', 'Other',
  'Marketing', 'Travel', 'Equipment', 'Salaries', 'Subscriptions',
]

export const EXPENSE_CATEGORIES = [
  ...PROJECT_CATEGORIES,
  'Donations', 'Emergency', 'Groceries', 'Transport', 'Utilities',
]

export const PAYMENT_METHODS = [
  'card', 'bank_transfer', 'cash', 'wallet', 'check', 'other',
]
