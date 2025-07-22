'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { TutorInvoice } from '~/lib/invoices/types/types';
import { formatPeriod, generateMonthOptions } from '~/lib/utils/month-utils';
import DataTable from '~/core/ui/DataTable';
import { useTablePagination } from '~/core/hooks/use-table-pagination';
import SearchBar from '../base-v2/ui/SearchBar';
import Filter from '../base/Filter';
import { columnWidthsAdminTutorPayments } from '~/lib/constants-v2';
import PaymentDetailsDialog from './PaymentDetailsDialog';

interface AdminTutorPaymentsViewProps {
  invoices: TutorInvoice[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  isLoading?: boolean;
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
  invoices: initialInvoices,
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<TutorInvoice | null>(
    null,
  );
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  // Local state for invoices to handle optimistic updates
  const [invoices, setInvoices] = useState<TutorInvoice[]>(initialInvoices);

  // Generate period options using the reusable utility
  const periodOptions = useMemo(() => generateMonthOptions(), []);

  // Update local invoices when props change
  React.useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  // Handle period change
  const handlePeriodChange = (value: string) => {
    onPeriodChange(value);
  };

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

  const handleViewDetails = (invoice: TutorInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDetailsDialog(false);
    setSelectedInvoice(null);
  };

  const handleTutorStatusChange = (
    invoiceId: string,
    status: 'issued' | 'paid' | 'proof_uploaded',
  ) => {
    // Update the invoice status in the local state
    setInvoices((prevInvoices) =>
      prevInvoices.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status } : invoice,
      ),
    );

    // Update the selected invoice if it's the one being changed
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prevInvoice) =>
        prevInvoice ? { ...prevInvoice, status } : null,
      );
    }
  };

  const handleTutorInvoiceUpdate = (updatedInvoice: TutorInvoice) => {
    // Update the invoice in the local state
    setInvoices((prevInvoices) =>
      prevInvoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
      ),
    );

    // Update the selected invoice if it's the one being updated
    if (selectedInvoice && selectedInvoice.id === updatedInvoice.id) {
      setSelectedInvoice(updatedInvoice);
    }
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetails(invoice)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading invoices...</span>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {!isLoading && (
        <DataTable
          data={tableData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPaginationChange={handlePaginationChange}
          columnWidths={columnWidthsAdminTutorPayments}
        />
      )}

      {/* Tutor Invoice Details Dialog */}
      {selectedInvoice && (
        <PaymentDetailsDialog
          open={showDetailsDialog}
          onClose={handleCloseDialog}
          tutorInvoice={selectedInvoice}
          onTutorStatusChange={handleTutorStatusChange}
          onTutorInvoiceUpdate={handleTutorInvoiceUpdate}
        />
      )}
    </div>
  );
};

export default AdminTutorPaymentsView;
