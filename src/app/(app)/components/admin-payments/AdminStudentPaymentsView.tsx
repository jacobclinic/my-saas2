'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import PaymentDetailsDialog from './PaymentDetailsDialog';
import {
  PaymentWithDetails,
  PaymentStatus,
} from '~/lib/payments/types/admin-payments';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import {
  approveStudentPaymentAction,
  rejectStudentPaymentAction,
} from '~/lib/payments/admin-payment-actions';
import DataTable from '~/core/ui/DataTable';
import { useTablePagination } from '~/core/hooks/use-table-pagination';
import SearchBar from '../base-v2/ui/SearchBar';
import Filter from '../base/Filter';
import { toast } from 'sonner';
import { formatPeriod, generateMonthOptions } from '~/lib/utils/month-utils';
import { columnWidthsAdminStudentPayments } from '~/lib/constants-v2';

interface AdminStudentPaymentsViewProps {
  payments: PaymentWithDetails[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  isLoading?: boolean;
}

// Define a type for the table data
interface PaymentTableData {
  id: string;
  studentName: string;
  className: string;
  tutorName: string;
  period: string;
  amount: number;
  submittedDate: string;
  status: PaymentStatus;
  invoiceNo: string;
}

const AdminStudentPaymentsView: React.FC<AdminStudentPaymentsViewProps> = ({
  payments: initialPayments,
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const csrfToken = useCsrfToken();
  const [, startTransition] = useTransition();
  // Local state for payments to handle optimistic updates
  const [payments, setPayments] =
    useState<PaymentWithDetails[]>(initialPayments);

  // Generate period options using utility function
  const periodOptions = useMemo(() => generateMonthOptions(), []);

  // Update local payments when props change
  React.useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  // Handle period change
  const handlePeriodChange = (value: string) => {
    onPeriodChange(value);
  };

  // Define filter options for search
  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Student', value: 'student' },
    { label: 'Class', value: 'class' },
    { label: 'Tutor', value: 'tutor' },
  ];

  // Define status options for filter dropdown
  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Pending', value: PaymentStatus.PENDING },
    { label: 'Processing', value: PaymentStatus.PENDING_VERIFICATION },
    { label: 'Verified', value: PaymentStatus.VERIFIED },
    { label: 'Rejected', value: PaymentStatus.REJECTED },
    { label: 'Not Paid', value: PaymentStatus.NOT_PAID },
  ];

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Filter by search query
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        switch (searchFilter) {
          case 'student':
            matchesSearch = payment.studentName.toLowerCase().includes(query);
            break;
          case 'class':
            matchesSearch = payment.className.toLowerCase().includes(query);
            break;
          case 'tutor':
            matchesSearch = payment.tutorName.toLowerCase().includes(query);
            break;
          case 'all':
          default:
            matchesSearch =
              payment.studentName.toLowerCase().includes(query) ||
              payment.className.toLowerCase().includes(query) ||
              payment.tutorName.toLowerCase().includes(query);
        }
      }

      // Filter by status
      const matchesStatus =
        selectedStatus === 'all' || payment.status === selectedStatus;

      // Filter by period
      const matchesPeriod =
        selectedPeriod === 'all' || payment.period === selectedPeriod;

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [payments, searchQuery, searchFilter, selectedStatus, selectedPeriod]);

  // Setup pagination
  const {
    paginatedData,
    pageIndex,
    pageSize,
    pageCount,
    handlePaginationChange,
  } = useTablePagination({ data: filteredPayments });

  const handleViewDetails = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDetailsDialog(false);
    setSelectedPayment(null);
  };

  const handleApprovePayment = async (paymentId: string) => {
    startTransition(async () => {
      const result = await approveStudentPaymentAction({
        paymentId,
        csrfToken,
      });

      if (result.success) {
        // Update the local state
        setPayments((prevPayments) =>
          prevPayments.map((payment) =>
            payment.id === paymentId
              ? { ...payment, status: PaymentStatus.VERIFIED }
              : payment,
          ),
        );
        setShowDetailsDialog(false);
      } else {
        console.error('Failed to approve payment:', result.error);
      }
    });
  };
  const handleRejectPayment = async (paymentId: string, reason: string) => {
    startTransition(async () => {
      const result = await rejectStudentPaymentAction({
        paymentId,
        reason,
        csrfToken,
      });

      if (result.success) {
        // Update the local state
        setPayments((prevPayments) =>
          prevPayments.map((payment) =>
            payment.id === paymentId
              ? { ...payment, status: PaymentStatus.REJECTED, notes: reason }
              : payment,
          ),
        );
        setShowDetailsDialog(false);
      } else {
        console.error('Failed to reject payment:', result.error);
      }
    });
  };
  const handlePaymentUpload = async (paymentId: string, url: string) => {
    // Update the payment with the new proof URL and status
    setPayments((prevPayments) =>
      prevPayments.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              paymentProofUrl: url,
              status: PaymentStatus.PENDING_VERIFICATION,
            }
          : payment,
      ),
    );

    // Update the selected payment if it's the same one
    if (selectedPayment?.id === paymentId) {
      setSelectedPayment((prev) =>
        prev
          ? {
              ...prev,
              paymentProofUrl: url,
              status: PaymentStatus.PENDING_VERIFICATION,
            }
          : prev,
      );
    }

    toast.success('Payment proof uploaded successfully');
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            Pending
          </Badge>
        );
      case PaymentStatus.PENDING_VERIFICATION:
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            Processing
          </Badge>
        );
      case PaymentStatus.VERIFIED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Verified
          </Badge>
        );
      case PaymentStatus.REJECTED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Rejected
          </Badge>
        );
      case PaymentStatus.NOT_PAID:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Not Paid
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
      header: 'Student',
      accessorKey: 'studentName',
    },
    {
      header: 'Class',
      accessorKey: 'className',
    },
    {
      header: 'Tutor',
      accessorKey: 'tutorName',
    },
    {
      header: 'Period',
      accessorKey: 'period',
      cell: ({ row }: { row: { original: PaymentTableData } }) => (
        <span>{formatPeriod(row.original.period)}</span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      className: 'text-right',
      cell: ({ row }: { row: { original: PaymentTableData } }) => (
        <span className="text-right block">
          Rs. {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'submittedDate',
      cell: ({ row }: { row: { original: PaymentTableData } }) => (
        <span>
          {format(new Date(row.original.submittedDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: { original: PaymentTableData } }) => (
        <span
          style={{
            maxWidth: 80,
            minWidth: 80,
            width: 80,
            display: 'inline-block',
          }}
        >
          {getStatusBadge(row.original.status)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: { row: { original: PaymentTableData } }) => {
        const paymentId = row.original.id;
        const payment = payments.find((p) => p.id === paymentId);

        if (payment) {
          return (
            <div
              className="flex justify-center gap-2"
              style={{ maxWidth: 30, minWidth: 30, width: 30 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetails(payment)}
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

  // Map payments to table data format
  const tableData: PaymentTableData[] = paginatedData.map((payment) => ({
    id: payment.id,
    studentName: payment.studentName,
    className: payment.className,
    tutorName: payment.tutorName,
    period: payment.period,
    amount: payment.amount,
    submittedDate: payment.submittedDate,
    status: payment.status,
    invoiceNo: payment.invoiceNo || '',
  }));

  return (
    <div className="space-y-6 width-full">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-w-[150px]">
          <SearchBar
            name="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchFilter === 'all' ? 'student, class or tutor' : searchFilter}...`}
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
            <span className="text-gray-600">Loading payments...</span>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {!isLoading && (
        <DataTable
          data={tableData}
          columns={columns}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPaginationChange={handlePaginationChange}
          columnWidths={columnWidthsAdminStudentPayments}
        />
      )}
      {/* Payment Details Dialog */}
      {selectedPayment && (
        <PaymentDetailsDialog
          open={showDetailsDialog}
          onClose={handleCloseDialog}
          payment={selectedPayment}
          onApprove={handleApprovePayment}
          onReject={handleRejectPayment}
          onPaymentUpload={handlePaymentUpload}
        />
      )}
    </div>
  );
};

export default AdminStudentPaymentsView;
