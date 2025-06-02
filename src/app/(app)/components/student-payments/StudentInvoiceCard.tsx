'use client';

import React from 'react';
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

interface StudentInvoiceCardProps {
  invoice: {
    id: string;
    invoice_no: string | null;
    class_name: string | null;
    class_subject?: string | null;
    amount: number | null;
    due_date: string | null;
    payment_status: 'completed' | 'pending' | 'not_paid';
    month: string;
  };
}

const StudentInvoiceCard: React.FC<StudentInvoiceCardProps> = ({ invoice }) => {
  const handleViewInvoice = () => {
    // TODO: Implement view invoice functionality
    console.log('View invoice:', invoice.id);
  };

  const handleDownloadInvoice = () => {
    // TODO: Implement download invoice functionality
    console.log('Download invoice:', invoice.id);
  };

  const handlePayNow = () => {
    // TODO: Implement payment functionality
    console.log('Pay now:', invoice.id );
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

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">
              {invoice.invoice_no || `Invoice #${invoice.id.slice(0, 8)}`}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Period: {formatPeriod(invoice.month)}
            </p>
          </div>
          {getStatusBadge(invoice.payment_status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Book className="h-4 w-4 text-blue-600 mr-2" />
              <div>
                <p className="font-medium">
                  {invoice.class_name || 'Unknown Class'}
                </p>
                {invoice.class_subject && (
                  <p className="text-gray-600">{invoice.class_subject}</p>
                )}
              </div>
            </div>

            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 text-green-600 mr-2" />
              <div>
                <p className="font-medium">
                  Rs. {invoice.amount ? invoice.amount.toLocaleString() : '0'}
                </p>
                <p className="text-gray-600">Class Fee</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 text-orange-600 mr-2" />
              <div>
                <p className="font-medium">{formatDate(invoice.due_date)}</p>
                <p className="text-gray-600">Payment Due Date</p>
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
          </Button>

          {invoice.payment_status !== 'completed' && (
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
      </CardContent>
    </Card>
  );
};

export default StudentInvoiceCard;
