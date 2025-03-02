'use client'

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../base-v2/ui/Tabs";
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { getPaymentSummaryAction } from '~/lib/payments/admin-payment-actions';
import AdminPaymentsView from './AdminStudentPaymentsView';
import TutorPayments from '../payments/TutorPaymentList';
import { Payment } from '~/lib/payments/types/admin-payments';
import AdminOverviewTab from './AdminOverviewTab';

interface PaymentSummary {
  total: number;
  pending: number;
  pendingVerification: number;
  verified: number;
  rejected: number;
  totalVerifiedAmount: number;
}

interface AdminPaymentsPanelProps {
  initialPayments: Payment[];
  initialSummary: PaymentSummary | null;
}

const AdminPaymentsPanel = ({ initialPayments, initialSummary }: AdminPaymentsPanelProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(initialSummary);
  const [isLoading, setIsLoading] = useState(true);
  const csrfToken = useCsrfToken();

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setIsLoading(true);
        const result = await getPaymentSummaryAction({ csrfToken });
        
        if (result.success && result.summary) {
          setPaymentSummary(result.summary);
        }
      } catch (error) {
        console.error('Error fetching payment summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, [csrfToken]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
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