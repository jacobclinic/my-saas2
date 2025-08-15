import { Database } from '~/database.types';

export type Invoice = Database['public']['Tables']['invoices']['Row'];

export type PaidStudentInvoice = Pick<Invoice, 'amount'>;