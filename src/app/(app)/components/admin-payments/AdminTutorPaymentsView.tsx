'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Search, Eye, CheckCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { TutorInvoice } from '~/lib/invoices/types/types';
import {
  getTutorInvoicesForPeriod,
  markTutorInvoiceAsPaidAction,
} from '~/lib/payments/admin-payment-actions';
import { formatPeriod, generateMonthOptions } from '~/lib/utils/month-utils';
import DataTable from '~/core/ui/DataTable';
import { useTablePagination } from '~/core/hooks/use-table-pagination';
import SearchBar from '../base-v2/ui/SearchBar';
import Filter from '../base/Filter';
import { toast } from 'sonner';

interface AdminTutorPaymentsViewProps {
  initialInvoices: TutorInvoice[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

// Define a type for the table data
interface TutorInvoiceTableData {
  id: string;
  tutorName: string;
  tutorEmail: string;
  className: string;
  period: string;
  amount: number;
  createdDate: string;
  status: string;
  invoiceNo: string;
}

const AdminTutorPaymentsView: React.FC<AdminTutorPaymentsViewProps> = ({
  initialInvoices,
  selectedPeriod: parentSelectedPeriod,
  onPeriodChange,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // Use parent's selected period or fallback to URL/current month
  const urlMonth = searchParams.get('month');
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const selectedPeriod = parentSelectedPeriod || urlMonth || currentMonth;

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  // Start with server-provided data
  const [invoices, setInvoices] = useState<TutorInvoice[]>(initialInvoices);

  // Generate period options using the reusable utility
  const periodOptions = useMemo(() => generateMonthOptions(), []);

  // Function to fetch data for the selected period
  const fetchInvoicesForPeriod = async (period: string) => {
    setIsLoading(true);
    try {
      const result = await getTutorInvoicesForPeriod(period);
      if (result.success && result.invoices) {
        setInvoices(result.invoices);
      } else {
        toast.error(result.error || 'Failed to fetch tutor invoices');
      }
    } catch (error) {
      console.error('Error fetching tutor invoices:', error);
      toast.error('Failed to load tutor invoice data');
    } finally {
      setIsLoading(false);
    }
  }; // Handle period change - use parent handler if available, otherwise update URL independently
  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      // Parent is managing period changes
      onPeriodChange(value);
    } else {
      // Component is managing its own period changes
      // Update URL with new month parameter
      const params = new URLSearchParams(searchParams.toString());
      params.set('month', value);

      // Use router.replace with shallow routing to avoid full page reload
      router.replace(`/payments?${params.toString()}`, { scroll: false });

      // Fetch new data for the selected period
      fetchInvoicesForPeriod(value);
    }
  };

  // Sync invoices data when initialInvoices change (from parent)
  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);
  // Only fetch data independently if no parent is managing the period and we have no initial data
  useEffect(() => {
    // Only fetch if:
    // 1. No parent is managing the period (onPeriodChange is null/undefined)
    // 2. We have no initial invoices
    // 3. URL has a month parameter that differs from current selection
    if (!onPeriodChange && initialInvoices.length === 0) {
      if (searchParams.has('month')) {
        const month = searchParams.get('month');
        if (month && month !== selectedPeriod) {
          fetchInvoicesForPeriod(month);
        }
      } else {
        // Fetch current month data if no month in URL
        fetchInvoicesForPeriod(selectedPeriod);
      }
    }
  }, [searchParams, onPeriodChange, initialInvoices.length, selectedPeriod]);

  // Define filter options for search
  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Tutor', value: 'tutor' },
    { label: 'Class', value: 'class' },
    { label: 'Email', value: 'email' },
  ];

  // Define status options for filter dropdown
  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Issued', value: 'issued' },
    { label: 'Paid', value: 'paid' },
  ];

  // Filter invoices based on search and filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Filter by search query
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        switch (searchFilter) {
          case 'tutor':
            matchesSearch = invoice.tutor_name.toLowerCase().includes(query);
            break;
          case 'class':
            matchesSearch = invoice.class_name.toLowerCase().includes(query);
            break;
          case 'email':
            matchesSearch = invoice.tutor_email.toLowerCase().includes(query);
            break;
          case 'all':
          default:
            matchesSearch =
              invoice.tutor_name.toLowerCase().includes(query) ||
              invoice.class_name.toLowerCase().includes(query) ||
              invoice.tutor_email.toLowerCase().includes(query);
        }
      }

      // Filter by status
      const matchesStatus =
        selectedStatus === 'all' || invoice.status === selectedStatus;

      // Filter by period
      const matchesPeriod =
        selectedPeriod === 'all' || invoice.payment_period === selectedPeriod;

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [invoices, searchQuery, searchFilter, selectedStatus, selectedPeriod]);

  // Setup pagination
  const {
    paginatedData,
    pageIndex,
    pageSize,
    pageCount,
    handlePaginationChange,
  } = useTablePagination({ data: filteredInvoices });

  const handleMarkAsPaid = async (invoiceId: string) => {
    startTransition(async () => {
      const result = await markTutorInvoiceAsPaidAction({
        invoiceId,
      });

      if (result.success) {
        // Update the local state
        setInvoices((prevInvoices) =>
          prevInvoices.map((invoice) =>
            invoice.id === invoiceId ? { ...invoice, status: 'paid' } : invoice,
          ),
        );
        toast.success('Invoice marked as paid');
      } else {
        toast.error(result.error || 'Failed to mark invoice as paid');
      }
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'issued':
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            Issued
          </Badge>
        );
      case 'paid':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Paid
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            Unknown
          </Badge>
        );
    }
  };

  // Define columns for DataTable
  const columns = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNo',
    },
    {
      header: 'Tutor',
      accessorKey: 'tutorName',
    },
    {
      header: 'Email',
      accessorKey: 'tutorEmail',
    },
    {
      header: 'Class',
      accessorKey: 'className',
    },
    {
      header: 'Period',
      accessorKey: 'period',
      cell: ({ row }: { row: { original: TutorInvoiceTableData } }) => (
        <span>{formatPeriod(row.original.period)}</span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }: { row: { original: TutorInvoiceTableData } }) => (
        <span className="text-right block">
          Rs. {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'createdDate',
      cell: ({ row }: { row: { original: TutorInvoiceTableData } }) => (
        <span>{format(new Date(row.original.createdDate), 'MMM d, yyyy')}</span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: { original: TutorInvoiceTableData } }) =>
        getStatusBadge(row.original.status),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: { row: { original: TutorInvoiceTableData } }) => {
        const invoiceId = row.original.id;
        const invoice = invoices.find((i) => i.id === invoiceId);

        if (invoice) {
          return (
            <div className="flex justify-center gap-2">
              {invoice.status === 'issued' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsPaid(invoice.id)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                  disabled={isPending}
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="ml-1 text-xs">Mark Paid</span>
                </Button>
              )}

              {invoice.status === 'paid' && (
                <span className="text-green-600 text-sm font-medium">
                  ✓ Paid
                </span>
              )}
            </div>
          );
        }
        return null;
      },
    },
  ];

  // Map invoices to table data format
  const tableData: TutorInvoiceTableData[] = paginatedData.map((invoice) => ({
    id: invoice.id,
    tutorName: invoice.tutor_name,
    tutorEmail: invoice.tutor_email,
    className: invoice.class_name,
    period: invoice.payment_period,
    amount: invoice.amount,
    createdDate: invoice.created_at,
    status: invoice.status || 'draft',
    invoiceNo: invoice.invoice_no || `TI-${invoice.id.slice(0, 8)}`,
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-w-[150px]">
          <SearchBar
            name="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchFilter === 'all' ? 'tutor, class or email' : searchFilter}...`}
          />
        </div>

        <Filter
          name="Search Filter"
          placeholder="Search by an attribute"
          width="150px"
          options={filterOptions}
          value={searchFilter}
          onChange={setSearchFilter}
        />

        <Filter
          name="Status"
          placeholder="Filter by status"
          width="150px"
          options={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
        />

        <Filter
          name="Period"
          placeholder="Select a month"
          width="200px"
          options={periodOptions}
          value={selectedPeriod}
          onChange={handlePeriodChange}
        />
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="py-8 text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-2 text-gray-600">Loading tutor invoice data...</p>
        </div>
      ) : (
        <DataTable
          data={tableData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPaginationChange={handlePaginationChange}
        />
      )}
    </div>
  );
};

export default AdminTutorPaymentsView;
