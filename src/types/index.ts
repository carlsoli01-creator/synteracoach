export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'overdue' | 'paid';
  description?: string;
  createdAt: Date;
  remindersSent: number;
  lastReminderAt?: Date;
}

export type InvoiceStatus = Invoice['status'];
