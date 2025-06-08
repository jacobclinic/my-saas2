'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Search,
  Calendar,
  Eye,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { Badge } from '../base-v2/ui/Badge';
import { Input } from '../base-v2/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../base-v2/ui/Select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/core/ui/Table';
import { InvoiceView } from './InvoiceDialog';
import { Button } from '../base-v2/ui/Button';
import useUserSession from '~/core/hooks/use-user-session';
import useUserId from '~/core/hooks/use-user-id';
import { getTutorInvoicesAction } from '~/lib/invoices/tutor-invoice-actions';
import type { TutorInvoice } from '~/lib/invoices/types/types';
import {
  generateMonthOptions,
  formatPeriod,
  getCurrentMonthPeriod,
  getPreviousMonthPeriod,
  periodToMonthName,
  monthNameToPeriod,
} from '~/lib/payments/utils/month-utils';
import {
  TutorPaymentData,
  TutorPaymentStats,
} from '~/lib/payments/types/tutor-payments';

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');

  // Generate month options and set default to current month
  const monthOptions = generateMonthOptions();
  const currentMonthPeriod = getCurrentMonthPeriod();
  const [monthFilter, setMonthFilter] = useState(
    periodToMonthName(currentMonthPeriod),
  ); // Default to current month name

  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<TutorPaymentData[]>([]);
  const [currentMonthInvoices, setCurrentMonthInvoices] = useState<
    TutorInvoice[]
  >([]);
  const [lastMonthEarnings, setLastMonthEarnings] = useState<number>(0);
  const [stats, setStats] = useState<TutorPaymentStats>({
    monthlyEarnings: 0,
    activeStudents: 0,
    monthlyGrowth: 0,
    averagePerStudent: 0,
    pendingPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const userSession = useUserSession();
  const userId = useUserId();
  // Helper functions for month period formatting
  const getCurrentMonth = (): string => getCurrentMonthPeriod();
  const getPreviousMonth = (): string => getPreviousMonthPeriod();
  const getMonthPeriod = (monthName: string): string =>
    monthNameToPeriod(monthName);

  // Transform TutorInvoice to TutorPaymentData
  const transformInvoiceToPayment = (
    invoice: TutorInvoice,
  ): TutorPaymentData => {
    // Parse the payment period to create a readable date
    const [year, month] = invoice.payment_period.split('-');
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthName = monthNames[parseInt(month) - 1] || 'Unknown';

    // For now, assume 1 student per invoice (this could be improved by counting actual students)
    const studentCount =
      invoice.amount > 0
        ? Math.ceil(invoice.amount / (invoice.class_fee || 1))
        : 0;

    return {
      id: invoice.id,
      className: invoice.class_name,
      date: `${monthName} ${year}`,
      amount: invoice.amount,
      students: studentCount,
      status: invoice.status === 'paid' ? 'paid' : 'pending',
    };
  };
  // Calculate statistics from current month invoices and previous month earnings
  const calculateStats = (
    currentInvoices: TutorInvoice[],
    previousMonthTotal: number,
  ): TutorPaymentStats => {
    const monthlyEarnings = currentInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0,
    );

    const activeStudents = currentInvoices.reduce((sum, inv) => {
      return (
        sum +
        (inv.amount > 0 ? Math.ceil(inv.amount / (inv.class_fee || 1)) : 0)
      );
    }, 0);

    const pendingPayments = currentInvoices.filter(
      (inv) => inv.status === 'issued',
    ).length;

    const monthlyGrowth =
      previousMonthTotal > 0
        ? ((monthlyEarnings - previousMonthTotal) / previousMonthTotal) * 100
        : monthlyEarnings > 0
          ? 100
          : 0;

    const averagePerStudent =
      activeStudents > 0 ? monthlyEarnings / activeStudents : 0;

    return {
      monthlyEarnings,
      activeStudents,
      monthlyGrowth,
      averagePerStudent,
      pendingPayments,
    };
  };
  // Fetch invoices for a specific month
  const fetchInvoicesForMonth = async (
    monthPeriod: string,
  ): Promise<TutorInvoice[]> => {
    if (!userId) return [];

    try {
      const result = await getTutorInvoicesAction({
        tutorId: userId,
        invoicePeriod: monthPeriod,
      });

      if (result.success && result.invoices) {
        return result.invoices;
      } else {
        throw new Error(result.error || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching tutor invoices:', err);
      return [];
    }
  };

  // Initial load: current month + previous month for growth calculation
  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const currentMonth = getCurrentMonth();
        const previousMonth = getPreviousMonth(); // Fetch current month and previous month data
        const [currentMonthData, previousMonthData] = await Promise.all([
          fetchInvoicesForMonth(currentMonth),
          fetchInvoicesForMonth(previousMonth),
        ]);

        // Calculate previous month total earnings
        const previousMonthTotal = previousMonthData.reduce(
          (sum, inv) => sum + inv.amount,
          0,
        );

        // Transform current month invoices to payment data
        const transformedPayments = currentMonthData.map(
          transformInvoiceToPayment,
        );
        setCurrentMonthInvoices(currentMonthData);
        setLastMonthEarnings(previousMonthTotal);
        setPayments(transformedPayments);
        setStats(calculateStats(currentMonthData, previousMonthTotal));
        setHasInitiallyLoaded(true);
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    startTransition(() => {
      loadInitialData();
    });
  }, [userId]); // Load specific month when filter changes
  useEffect(() => {
    if (!userId || !hasInitiallyLoaded) return;

    const currentMonth = new Date().toLocaleDateString('en-US', {
      month: 'long',
    });
    const loadMonthData = async () => {
      setIsFilterLoading(true);
      setError(null);

      // Clear payments immediately to prevent stale data from being filtered
      setPayments([]);

      try {
        const selectedMonthPeriod = getMonthPeriod(monthFilter);
        const selectedMonthData =
          await fetchInvoicesForMonth(selectedMonthPeriod);

        // Transform selected month invoices to payment data
        const transformedPayments = selectedMonthData.map(
          transformInvoiceToPayment,
        );

        setPayments(transformedPayments);

        // If switching back to current month, update currentMonthInvoices as well
        if (monthFilter === currentMonth) {
          setCurrentMonthInvoices(selectedMonthData);
        }

        // Use the stored last month earnings for growth calculation
        setStats(calculateStats(selectedMonthData, lastMonthEarnings));
      } catch (err) {
        setError('An error occurred while fetching month data');
        console.error('Error loading month data:', err);
      } finally {
        setIsFilterLoading(false);
      }
    };

    startTransition(() => {
      loadMonthData();
    });
  }, [monthFilter, userId, lastMonthEarnings, hasInitiallyLoaded]); // Don't filter during loading to prevent "No payments found" flash
  const filteredPayments = isFilterLoading
    ? []
    : payments.filter((p) => {
        if (
          searchTerm &&
          !p.className.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        // Remove month filter since we're already loading the correct month's data
        if (statusFilter !== 'All' && p.status !== statusFilter) {
          return false;
        }
        return true;
      });

  const totalEarnings = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue-600 mx-auto"></div>
            <p className="mt-2 text-neutral-600">
              Loading your payment data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Error loading payment data</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                Rs. {stats.monthlyEarnings.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-blue-600" />
            </div>
          </div>{' '}
          <div className="mt-4 flex items-center">
            {stats.monthlyGrowth > 0 ? (
              <Badge className="bg-success-light text-success-dark">
                <ArrowUpRight size={14} className="mr-1" />
                {stats.monthlyGrowth.toFixed(1)}% up
              </Badge>
            ) : stats.monthlyGrowth < 0 ? (
              <Badge className="bg-error-light text-error-dark">
                <ArrowDownRight size={14} className="mr-1" />
                {Math.abs(stats.monthlyGrowth).toFixed(1)}% down
              </Badge>
            ) : (
              <Badge className="bg-neutral-100 text-neutral-600">
                No change
              </Badge>
            )}
            <span className="text-sm text-neutral-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Active Students</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.activeStudents}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-orange-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-orange-600" />
            </div>
          </div>{' '}
          <div className="mt-4">
            <p className="text-sm text-neutral-600">
              Avg. Rs. {Math.round(stats.averagePerStudent).toLocaleString()}{' '}
              per student
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Pending Payments</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.pendingPayments}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-warning-light flex items-center justify-center">
              <Calendar className="h-6 w-6 text-warning-dark" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-neutral-600">Due this month</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-grow">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={18}
          />
          <Input
            placeholder="Search by class name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>{' '}
        <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
          {' '}
          <div className="flex items-center gap-2 min-w-[150px]">
            {' '}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Current Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={periodToMonthName(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 min-w-[100px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>{' '}
      {/* Payments Table */}
      {isFilterLoading ? (
        <div className="py-8 text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-2 text-gray-600">Loading month data...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>{' '}
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.className}
                      </TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.students}</TableCell>
                      <TableCell>
                        Rs. {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            payment.status === 'paid'
                              ? 'bg-success-light text-success-dark'
                              : 'bg-warning-light text-warning-dark'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-primary-blue-200 text-primary-blue-700 hover:bg-primary-blue-50"
                          onClick={() =>
                            setSelectedInvoice({
                              id: payment.id,
                              classTitle: payment.className,
                              date: payment.date,
                              amount: payment.amount,
                              students: payment.students,
                            })
                          }
                        >
                          <Eye size={16} className="mr-2" />
                          View Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-neutral-600"
                    >
                      <p>No payments found matching your filters.</p>
                      <Button
                        variant="link"
                        className="mt-2 text-primary-blue-600"
                        onClick={() => {
                          setSearchTerm('');
                          setMonthFilter(
                            new Date().toLocaleDateString('en-US', {
                              month: 'long',
                            }),
                          );
                          setStatusFilter('All');
                        }}
                      >
                        Clear all filters
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {selectedInvoice && (
        <InvoiceView
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}
