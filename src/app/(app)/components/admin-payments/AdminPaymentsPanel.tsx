'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../base-v2/ui/Tabs';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import {
  getPaymentSummaryAction,
  generateInvoicesAction,
} from '~/lib/payments/admin-payment-actions';
import AdminPaymentsView from './AdminStudentPaymentsView';
import TutorPayments from '../payments/TutorPaymentList';
import { PaymentWithDetails } from '~/lib/payments/types/admin-payments';
import AdminOverviewTab from './AdminOverviewTab';
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

interface PaymentSummary {
  total: number;
  pending: number;
  pendingVerification: number;
  verified: number;
  rejected: number;
  notPaid: number;
  totalVerifiedAmount: number;
}

interface AdminPaymentsPanelProps {
  initialPayments: PaymentWithDetails[];
  initialSummary: PaymentSummary | null;
}

const AdminPaymentsPanel = ({
  initialPayments,
  initialSummary,
}: AdminPaymentsPanelProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    initialSummary,
  );
  const [isLoading, setIsLoading] = useState(false);
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

      const result = await generateInvoicesAction({
        csrfToken,
        invoicePeriod: selectedInvoiceMonth,
      });

      if (result.success) {
        setInvoiceMessage({
          type: 'success',
          text: `${result.message} for ${selectedInvoiceMonth} (took ${result.executionTime} seconds)`,
        });

        // Refresh data after generating invoices
        const summaryResult = await getPaymentSummaryAction({ csrfToken });
        if (summaryResult.success && summaryResult.summary) {
          setPaymentSummary(summaryResult.summary);
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
    <div className="p-6 max-w-6xl">
      {' '}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>{' '}
        {activeTab !== 'overview' && (
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
        )}
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="student-payments">Student Payments</TabsTrigger>
          <TabsTrigger value="tutor-payments">Tutor Payments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <AdminOverviewTab
            paymentSummary={paymentSummary}
            isLoading={isLoading}
            onTabChange={handleTabChange}
          />
        </TabsContent>

        <TabsContent value="student-payments">
          <AdminPaymentsView initialPayments={initialPayments} />
        </TabsContent>

        <TabsContent value="tutor-payments">
          <TutorPayments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPaymentsPanel;
