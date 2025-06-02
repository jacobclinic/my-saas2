'use client';

import React, { useState, useEffect } from 'react';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { getStudentInvoicesAction } from '~/lib/invoices/server-action';
import StudentInvoiceCard from './StudentInvoiceCard';
import { Button } from '../base-v2/ui/Button';
import { Input } from '../base-v2/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../base-v2/ui/Select';
import { Search, Filter, RefreshCcw } from 'lucide-react';
import useUser from '~/core/hooks/use-user';

interface Invoice {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string | null;
  class_subject?: string | null;
  month: string;
  payment_status: 'completed' | 'pending' | 'not_paid';
  payment_proof_url: string | null;
  invoice_no: string | null;
  amount: number | null;
  invoice_date: string;
  due_date: string | null;
  status: string;
}

const StudentPaymentsView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const csrfToken = useCsrfToken();
  const user = useUser();

  const fetchInvoices = async () => {
    if (!user?.data?.id) return;

    setLoading(true);
    try {
      const result = await getStudentInvoicesAction({
        studentId: user.data.id,
        csrfToken,
      });

      if (result.success && result.invoices) {
        setInvoices(result.invoices);
        setFilteredInvoices(result.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.data?.id, csrfToken]);

  useEffect(() => {
    let filtered = invoices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.class_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.invoice_no
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.class_subject
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (invoice) => invoice.payment_status === statusFilter,
      );
    }

    // Filter by period
    if (periodFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.month === periodFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, periodFilter]);



  const getUniqueMonths = () => {
    const months = Array.from(
      new Set(invoices.map((invoice) => invoice.month)),
    );
    return months
      .map((month) => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return {
          value: month,
          label: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          }),
        };
      })
      .sort((a, b) => b.value.localeCompare(a.value));
  };

  const getPaymentSummary = () => {
    const total = invoices.length;
    const paid = invoices.filter(
      (inv) => inv.payment_status === 'completed',
    ).length;
    const pending = invoices.filter(
      (inv) => inv.payment_status === 'pending',
    ).length;
    const unpaid = invoices.filter(
      (inv) => inv.payment_status === 'not_paid',
    ).length;
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0,
    );
    const paidAmount = invoices
      .filter((inv) => inv.payment_status === 'completed')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    return { total, paid, pending, unpaid, totalAmount, paidAmount };
  };

  const summary = getPaymentSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Payments</h1>
        <p className="text-gray-600">
          Manage your class fee payments and invoices
        </p>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
            <p className="text-sm text-gray-600">Total Invoices</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{summary.paid}</p>
            <p className="text-sm text-gray-600">Paid</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {summary.pending}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{summary.unpaid}</p>
            <p className="text-sm text-gray-600">Unpaid</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by class name, invoice number, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="not_paid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {getUniqueMonths().map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={fetchInvoices}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Invoice Cards */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600 mb-4">
              {invoices.length === 0
                ? "You don't have any invoices yet."
                : 'No invoices match your current filters.'}
            </p>
            {invoices.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPeriodFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <StudentInvoiceCard
              key={invoice.id}
              invoice={invoice}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StudentPaymentsView;
