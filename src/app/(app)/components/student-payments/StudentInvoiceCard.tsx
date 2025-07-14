'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import {
  FileText,
  Download,
  CreditCard,
  Calendar,
  Book,
  DollarSign,
} from 'lucide-react';
import StudentInvoiceDialog from './StudentInvoiceDialog';
import PaymentDialog from './PaymentDialog';
import { generateInvoicePDF } from '~/lib/utils/pdfGenerator';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';

interface StudentInvoiceCardProps {
  invoice: {
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
  };
}

const StudentInvoiceCard: React.FC<StudentInvoiceCardProps> = ({ invoice }) => {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(invoice);

  // Update currentInvoice when invoice prop changes
  useEffect(() => {
    setCurrentInvoice(invoice);
  }, [invoice]);

  const handleViewInvoice = () => {
    // Open the invoice details dialog
    setShowInvoiceDialog(true);
  };
  const handleDownloadInvoice = () => {
    // Generate and download PDF invoice
    try {
      generateInvoicePDF(currentInvoice);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    }
  };
  const handlePayNow = () => {
    // Open payment dialog
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    // Update invoice status to pending after successful payment upload
    setCurrentInvoice((prev) => ({
      ...prev,
      payment_status: 'pending',
    }));
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case 'not_paid':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Unpaid
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Unknown
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Convert invoice data to session data format for PaymentDialog
  const convertToSessionData = () => {
    const [year, month] = currentInvoice.month.split('-');
    const monthDate = new Date(parseInt(year), parseInt(month) - 1);

    // Map payment status to PaymentStatus enum
    let paymentStatus: PaymentStatus;
    switch (currentInvoice.payment_status) {
      case 'completed':
        paymentStatus = PaymentStatus.VERIFIED;
        break;
      case 'pending':
        paymentStatus = PaymentStatus.PENDING;
        break;
      case 'not_paid':
        paymentStatus = PaymentStatus.NOT_PAID;
        break;
      default:
        paymentStatus = PaymentStatus.NOT_PAID;
    }

    return {
      id: currentInvoice.id,
      name: currentInvoice.class_name || 'Unknown Class',
      date: formatDate(currentInvoice.due_date) || 'N/A',
      time: 'N/A', // Time not available in invoice data
      paymentStatus: paymentStatus,
      paymentAmount: currentInvoice.amount || 0,
      zoomMeetingId: '', // Not available in invoice data
      classId: currentInvoice.class_id,
      sessionRawData: {
        id: currentInvoice.id,
        created_at: new Date().toISOString(),
        class_id: currentInvoice.class_id,
        recording_urls: null,
        status: 'upcoming',
        start_time: currentInvoice.month + '-01', // Use first day of month for payment period
        end_time: null,
        recurring_session_id: null,
        title: `Payment for ${currentInvoice.class_name || 'Unknown Class'}`,
        description: `Payment for ${formatPeriod(currentInvoice.month)}`,
        updated_at: null,
        meeting_url: null,
        zoom_meeting_id: '',
        zoom_session_name: null,
        zoom_host_token: null,
        zoom_participant_token: null,
        attendance_marked: null,
      },
    };
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {' '}
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">
              {currentInvoice.invoice_no ||
                `Invoice #${currentInvoice.id.slice(0, 8)}`}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Period: {formatPeriod(currentInvoice.month)}
            </p>
          </div>
          {getStatusBadge(currentInvoice.payment_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {' '}
            <div className="flex items-center text-sm">
              <Book className="h-4 w-4 text-blue-600 mr-2" />
              <div>
                <p className="font-medium">
                  {currentInvoice.class_name || 'Unknown Class'}
                </p>
                {currentInvoice.class_subject && (
                  <p className="text-gray-600">
                    {currentInvoice.class_subject}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 text-orange-600 mr-2" />
              <div>
                <p className="font-medium">
                  {formatDate(currentInvoice.due_date)}
                </p>
                <p className="text-gray-600">Payment Due Date</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {' '}
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 text-green-600 mr-2" />
              <div>
                {' '}
                <p className="font-medium">
                  Rs. {(currentInvoice.amount ?? 0).toLocaleString()}
                </p>
                <p className="text-gray-600">Class Fee</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewInvoice()}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadInvoice()}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Invoice
          </Button>{' '}
          {currentInvoice.payment_status !== 'completed' &&
            currentInvoice.payment_status !== 'pending' && (
              <Button
                size="sm"
                onClick={() => handlePayNow()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="h-4 w-4" />
                Pay Now
              </Button>
            )}
        </div>
      </CardContent>{' '}
      {/* Invoice Details Dialog */}
      <StudentInvoiceDialog
        open={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        invoice={currentInvoice}
      />
      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        sessionData={convertToSessionData()}
        studentId={currentInvoice.student_id}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Card>
  );
};

export default StudentInvoiceCard;
