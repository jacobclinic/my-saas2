'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../base-v2/ui/Tabs';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import {
  generateInvoicesAction,
  generateAllInvoicesAction,
  getTutorInvoicesForPeriod,
  getAllStudentPaymentsAction,
} from '~/lib/payments/admin-payment-actions';
import AdminStudentPaymentsView from './AdminStudentPaymentsView';
import AdminTutorPaymentsView from './AdminTutorPaymentsView';
import { PaymentWithDetails } from '~/lib/payments/types/admin-payments';
import { TutorInvoice } from '~/lib/invoices/types/types';
import { Button } from '../base-v2/ui/Button';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../base-v2/ui/Select';
import { Loader2, RefreshCcw, CheckCircle } from 'lucide-react';

interface AdminPaymentsPanelProps {}

const AdminPaymentsPanel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ref to track programmatic period changes to prevent double loading
  const isProgrammaticChange = useRef(false);

  // Get current period from URL or default to current month
  const urlMonth = searchParams.get('month');
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const [selectedPeriod, setSelectedPeriod] = useState(
    urlMonth || currentMonth,
  );

  const [activeTab, setActiveTab] = useState('student-payments');

  // Student payments state
  const [studentPayments, setStudentPayments] = useState<PaymentWithDetails[]>(
    [],
  );
  const [studentPaymentsLoaded, setStudentPaymentsLoaded] = useState(false);
  const [loadingStudentPayments, setLoadingStudentPayments] = useState(false);

  // Tutor invoices state
  const [tutorInvoices, setTutorInvoices] = useState<TutorInvoice[]>([]);
  const [tutorInvoicesLoaded, setTutorInvoicesLoaded] = useState(false);
  const [loadingTutorInvoices, setLoadingTutorInvoices] = useState(false);
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<string>('');
  const csrfToken = useCsrfToken();

  // Generate month options for invoice generation
  const invoiceMonthOptions = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth();

    // Current month
    const currentMonth = `${currentYear}-${(currentMonthNum + 1).toString().padStart(2, '0')}`;
    const currentMonthDate = new Date(currentYear, currentMonthNum);

    // Next month
    const nextMonthDate = new Date(currentYear, currentMonthNum + 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${(nextMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;

    return [
      {
        value: currentMonth,
        label: `Current Month (${currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
      },
      {
        value: nextMonth,
        label: `Next Month (${nextMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
      },
    ];
  }, []);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'student-payments' && !studentPaymentsLoaded) {
      loadStudentPaymentsForPeriod(selectedPeriod);
    }
    if (tab === 'tutor-payments' && !tutorInvoicesLoaded) {
      loadTutorInvoicesForPeriod(selectedPeriod);
    }
  };

  const loadStudentPaymentsForPeriod = async (period: string) => {
    setLoadingStudentPayments(true);
    try {
      const result = await getAllStudentPaymentsAction(period);
      if (result.paymentData && !result.error) {
        setStudentPayments(result.paymentData);
        setStudentPaymentsLoaded(true);
      } else {
        console.error('Failed to load student payments:', result.error);
      }
    } catch (error) {
      console.error('Error loading student payments:', error);
    } finally {
      setLoadingStudentPayments(false);
    }
  };

  const loadTutorInvoicesForPeriod = async (period: string) => {
    setLoadingTutorInvoices(true);
    try {
      const result = await getTutorInvoicesForPeriod(period);
      if (result.success && result.invoices) {
        setTutorInvoices(result.invoices);
        setTutorInvoicesLoaded(true);
      } else {
        console.error('Failed to load tutor invoices:', result.error);
      }
    } catch (error) {
      console.error('Error loading tutor invoices:', error);
    } finally {
      setLoadingTutorInvoices(false);
    }
  };
  useEffect(() => {
    const urlMonth = searchParams.get('month');
    if (isProgrammaticChange.current) {
      isProgrammaticChange.current = false;
      return;
    }
    if (urlMonth && urlMonth !== selectedPeriod) {
      setSelectedPeriod(urlMonth);
      if (studentPaymentsLoaded) {
        loadStudentPaymentsForPeriod(urlMonth);
      }
      if (tutorInvoicesLoaded) {
        loadTutorInvoicesForPeriod(urlMonth);
      }
    }
  }, [
    searchParams,
    selectedPeriod,
    studentPaymentsLoaded,
    tutorInvoicesLoaded,
  ]);

  // Load student payments and tutor invoices on initial mount
  useEffect(() => {
    if (!studentPaymentsLoaded) {
      loadStudentPaymentsForPeriod(selectedPeriod);
    }
    if (!tutorInvoicesLoaded) {
      loadTutorInvoicesForPeriod(selectedPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handlePeriodChange = (period: string) => {
    // Mark this as a programmatic change to prevent double loading
    isProgrammaticChange.current = true;

    // Update the selectedPeriod state first
    setSelectedPeriod(period);

    // Update URL with new month parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', period);
    router.replace(`/payments?${params.toString()}`, { scroll: false });

    // Reload data for the new period if tabs are already loaded
    if (studentPaymentsLoaded) {
      loadStudentPaymentsForPeriod(period);
    }
    if (tutorInvoicesLoaded) {
      loadTutorInvoicesForPeriod(period);
    }
  };

  const handleMonthSelection = (value: string) => {
    console.log('Month selected:', value);
    setSelectedInvoiceMonth(value);
  };
  const handleGenerateInvoices = async (): Promise<void> => {
    if (!selectedInvoiceMonth) {
      setInvoiceMessage({
        type: 'error',
        text: 'Please select a month for invoice generation',
      });
      return;
    }

    console.log('Generating invoices for month:', selectedInvoiceMonth);

    try {
      setIsGeneratingInvoices(true);
      setInvoiceMessage(null);

      const result = await generateAllInvoicesAction({
        invoicePeriod: selectedInvoiceMonth,
      });

      if (result.success) {
        setInvoiceMessage({
          type: 'success',
          text: `${result.message} for ${selectedInvoiceMonth} (took ${result.executionTime} seconds)`,
        });
        // Optionally, reload data if needed
        if (activeTab === 'student-payments') {
          loadStudentPaymentsForPeriod(selectedPeriod);
        }
        if (activeTab === 'tutor-payments') {
          loadTutorInvoicesForPeriod(selectedPeriod);
        }
      } else {
        setInvoiceMessage({
          type: 'error',
          text: result.message || 'Failed to generate invoices',
        });
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      setInvoiceMessage({
        type: 'error',
        text: 'An unexpected error occurred while generating invoices',
      });
    } finally {
      setIsGeneratingInvoices(false);
    }
  };

  return (
    <div className="p-2 max-w-full mx-auto ml-3 mr-3 mt-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select
            value={selectedInvoiceMonth}
            onValueChange={handleMonthSelection}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select month for invoice generation" />
            </SelectTrigger>
            <SelectContent>
              {invoiceMonthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerateInvoices}
            disabled={isGeneratingInvoices || !selectedInvoiceMonth}
            className="flex items-center gap-2"
          >
            {isGeneratingInvoices ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Invoices...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Generate Invoices
              </>
            )}
          </Button>
        </div>
      </div>
      {invoiceMessage && (
        <Alert
          className={`mb-4 ${invoiceMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
        >
          {invoiceMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Loader2 className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              invoiceMessage.type === 'success'
                ? 'text-green-700'
                : 'text-red-700'
            }
          >
            {invoiceMessage.text}
          </AlertDescription>
        </Alert>
      )}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="student-payments">Student Payments</TabsTrigger>
          <TabsTrigger value="tutor-payments">Tutor Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="student-payments">
          {loadingStudentPayments ? (
            <div className="py-8 text-center">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
              <p className="mt-2 text-gray-600">Loading student payments...</p>
            </div>
          ) : (
            <AdminStudentPaymentsView
              initialPayments={studentPayments}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          )}
        </TabsContent>
        <TabsContent value="tutor-payments">
          {loadingTutorInvoices ? (
            <div className="py-8 text-center">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
              <p className="mt-2 text-gray-600">Loading tutor invoices...</p>
            </div>
          ) : (
            <AdminTutorPaymentsView
              initialInvoices={tutorInvoices}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPaymentsPanel;
