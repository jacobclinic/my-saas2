'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentDetailsDialog from './PaymentDetailsDialog';
import {
  PaymentWithDetails,
  PaymentStatus,
} from '~/lib/payments/types/admin-payments';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import {
  approveStudentPaymentAction,
  getPaymentsForPeriod,
  rejectStudentPaymentAction,
} from '~/lib/payments/admin-payment-actions';
import DataTable from '~/core/ui/DataTable';
import { useTablePagination } from '~/core/hooks/use-table-pagination';
import SearchBar from '../base-v2/ui/SearchBar';
import Filter from '../base/Filter';
import { toast } from 'sonner';
import { formatPeriod, generateMonthOptions } from '~/lib/utils/month-utils';

interface AdminStudentPaymentsViewProps {
  initialPayments: PaymentWithDetails[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
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
  initialPayments,
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

  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const csrfToken = useCsrfToken();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  // Start with server-provided data
  const [payments, setPayments] =
    useState<PaymentWithDetails[]>(initialPayments);

  // Generate period options using utility function
  const periodOptions = useMemo(() => generateMonthOptions(), []);

  // Function to fetch data for the selected period
  const fetchPaymentsForPeriod = async (period: string) => {
    setIsLoading(true);
    try {
      const result = await getPaymentsForPeriod(period);
      if (result.success && result.payments) {
        setPayments(result.payments);
      } else {
        toast.error(result.error || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment data');
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
      fetchPaymentsForPeriod(value);
    }
  };

  // Sync payments data when initialPayments change (from parent)
  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);
  // Only fetch data independently if no parent is managing the period and we have no initial data
  useEffect(() => {
    // Only fetch if:
    // 1. No parent is managing the period (onPeriodChange is null/undefined)
    // 2. We have no initial payments
    // 3. URL has a month parameter that differs from current selection
    if (!onPeriodChange && initialPayments.length === 0) {
      if (searchParams.has('month')) {
        const month = searchParams.get('month');
        if (month && month !== selectedPeriod) {
          fetchPaymentsForPeriod(month);
        }
      } else {
        // Fetch current month data if no month in URL
        fetchPaymentsForPeriod(selectedPeriod);
      }
    }
  }, [searchParams, onPeriodChange, initialPayments.length, selectedPeriod]);

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
            className="bg-gray-100 text-gray-800 border-gray-300"
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
      cell: ({ row }: { row: { original: PaymentTableData } }) =>
        getStatusBadge(row.original.status),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: { row: { original: PaymentTableData } }) => {
        const paymentId = row.original.id;
        const payment = payments.find((p) => p.id === paymentId);

        if (payment) {
          return (
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetails(payment)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {(payment.status === PaymentStatus.PENDING ||
                payment.status === PaymentStatus.PENDING_VERIFICATION) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApprovePayment(payment.id)}
                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                    disabled={isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(payment)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    disabled={isPending}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
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
    <div className="space-y-6">
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
      {/* Payments Table */}
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
          <p className="mt-2 text-gray-600">Loading payment data...</p>
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
      )}{' '}
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
