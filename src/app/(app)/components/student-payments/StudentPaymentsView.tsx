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

  // Get current month as default
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  const [periodFilter, setPeriodFilter] = useState(() => getCurrentMonth());
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]); // Store all invoices for dropdown
  const csrfToken = useCsrfToken();
  const user = useUser();
  const fetchInvoices = async (month?: string) => {
    if (!user?.data?.id) return;

    setLoading(true);
    try {
      const result = await getStudentInvoicesAction({
        studentId: user.data.id,
        month,
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

  // Fetch all invoices for the dropdown (without month filter)
  const fetchAllInvoicesForDropdown = async () => {
    if (!user?.data?.id) return;

    try {
      const result = await getStudentInvoicesAction({
        studentId: user.data.id,
        // No month parameter to get all invoices
      });

      if (result.success && result.invoices) {
        setAllInvoices(result.invoices);
      }
    } catch (error) {
      console.error('Error fetching all invoices for dropdown:', error);
    }
  };
  useEffect(() => {
    // Load invoices for current month on initial load
    fetchInvoices(getCurrentMonth());
    // Also load all invoices for dropdown
    fetchAllInvoicesForDropdown();
  }, [user?.data?.id, csrfToken, periodFilter]);

  // Handle period filter changes with lazy loading
  useEffect(() => {
    const loadInvoicesForPeriod = async () => {
      if (periodFilter === 'all') {
        // If "all" is selected, load all invoices
        await fetchInvoices();
      } else {
        // Load specific month
        await fetchInvoices(periodFilter);
      }
    };

    // Only trigger if periodFilter has been explicitly changed by user
    if (periodFilter !== getCurrentMonth() || periodFilter === 'all') {
      loadInvoicesForPeriod();
    }
  }, [periodFilter]);

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

    // Note: Period filtering is now handled at the data fetch level
    // so we don't need to filter here by period

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  const getUniqueMonths = () => {
    const months = Array.from(
      new Set(allInvoices.map((invoice) => invoice.month)),
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

  return (
    <div className="xl:min-w-[900px] space-y-6">
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
        </div>
      </div>

      {/* Invoice Cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      ) : (
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
                    setPeriodFilter(getCurrentMonth());
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <StudentInvoiceCard key={invoice.id} invoice={invoice} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPaymentsView;
