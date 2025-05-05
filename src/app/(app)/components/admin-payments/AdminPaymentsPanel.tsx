// 'use client'

// import React, { useEffect, useState } from 'react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../base-v2/ui/Tabs";
// import useCsrfToken from '~/core/hooks/use-csrf-token';
// import { getPaymentSummaryAction } from '~/lib/payments/admin-payment-actions';
// import AdminPaymentsView from './AdminStudentPaymentsView';
// import TutorPayments from '../payments/TutorPaymentList';
// import { Payment } from '~/lib/payments/types/admin-payments';
// import AdminOverviewTab from './AdminOverviewTab';

// interface PaymentSummary {
//   total: number;
//   pending: number;
//   pendingVerification: number;
//   verified: number;
//   rejected: number;
//   totalVerifiedAmount: number;
// }

// interface AdminPaymentsPanelProps {
//   initialPayments: Payment[];
//   initialSummary: PaymentSummary | null;
// }

// const AdminPaymentsPanel = ({ initialPayments, initialSummary }: AdminPaymentsPanelProps) => {
//   const [activeTab, setActiveTab] = useState('overview');
//   const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(initialSummary);
//   const [isLoading, setIsLoading] = useState(true);
//   const csrfToken = useCsrfToken();

//   useEffect(() => {
//     const fetchSummaryData = async () => {
//       try {
//         setIsLoading(true);
//         const result = await getPaymentSummaryAction({ csrfToken });
        
//         if (result.success && result.summary) {
//           setPaymentSummary(result.summary);
//         }
//       } catch (error) {
//         console.error('Error fetching payment summary:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchSummaryData();
//   }, [csrfToken]);

//   const handleTabChange = (tab: string) => {
//     setActiveTab(tab);
//   };

//   return (
//     <div className="p-6 max-w-6xl">
//       <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
//       <Tabs value={activeTab} onValueChange={handleTabChange}>
//         <TabsList className="mb-6">
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="student-payments">Student Payments</TabsTrigger>
//           <TabsTrigger value="tutor-payments">Tutor Payments</TabsTrigger>
//         </TabsList>

//         {/* Overview Tab */}
//         <TabsContent value="overview">
//           <AdminOverviewTab 
//             paymentSummary={paymentSummary} 
//             isLoading={isLoading} 
//             onTabChange={handleTabChange} 
//           />
//         </TabsContent>
        
//         <TabsContent value="student-payments">
//           <AdminPaymentsView initialPayments={initialPayments} /> 
//         </TabsContent>
        
//         <TabsContent value="tutor-payments">
//           <TutorPayments />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default AdminPaymentsPanel;

'use client'

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../base-v2/ui/Tabs";
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { getPaymentSummaryAction, generateInvoicesAction } from '~/lib/payments/admin-payment-actions';
import AdminPaymentsView from './AdminStudentPaymentsView';
import TutorPayments from '../payments/TutorPaymentList';
import { Payment } from '~/lib/payments/types/admin-payments';
import AdminOverviewTab from './AdminOverviewTab';
import { Button } from "../base-v2/ui/Button";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
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
  initialPayments: Payment[];
  initialSummary: PaymentSummary | null;
}

const AdminPaymentsPanel = ({ initialPayments, initialSummary }: AdminPaymentsPanelProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(initialSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const csrfToken = useCsrfToken();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setIsLoading(true);
        // No longer passing a period to avoid automatic invoice generation
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
  
  const handleGenerateInvoices = async (): Promise<void> => {
    try {
      setIsGeneratingInvoices(true);
      setInvoiceMessage(null);
      
      const result = await generateInvoicesAction({ 
        csrfToken,
        invoicePeriod: currentMonth
      });
      
      if (result.success) {
        setInvoiceMessage({
          type: 'success',
          text: `${result.message} (took ${result.executionTime} seconds)`
        });
        
        // Refresh data after generating invoices
        const summaryResult = await getPaymentSummaryAction({ csrfToken });
        if (summaryResult.success && summaryResult.summary) {
          setPaymentSummary(summaryResult.summary);
        }
      } else {
        setInvoiceMessage({
          type: 'error',
          text: result.message || 'Failed to generate invoices'
        });
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      setInvoiceMessage({
        type: 'error',
        text: 'An unexpected error occurred while generating invoices'
      });
    } finally {
      setIsGeneratingInvoices(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleGenerateInvoices} 
            disabled={isGeneratingInvoices}
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
                Generate Invoices for {currentMonth}
              </>
            )}
          </Button>
        </div>
      </div>
      
      {invoiceMessage && (
        <Alert className={`mb-4 ${invoiceMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {invoiceMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Loader2 className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription 
            className={invoiceMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}
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