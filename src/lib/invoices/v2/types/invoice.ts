import { Database } from '~/database.types';

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];

export type PaidStudentInvoice = Pick<Invoice, 'amount'>;