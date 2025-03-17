'use client'

import React, { useState } from 'react';
import { InvoiceDialogProps, Payment, PaymentCardProps } from '~/lib/payments/types/tutor-payments';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Input } from "../base-v2/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../base-v2/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import { 
  Search, 
  Calendar,
  Download,
  FileText,
  DollarSign,
  Info,
  Building,
  Check,
  AlertTriangle
} from 'lucide-react';
import TutorPaymentCard from './TutorPaymentCard';
import InvoiceDialog from './InvoiceDialog';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';

const TutorPayments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);

  // Sample payment data
  const payments: Payment[] = [
    {
      id: "PAY-2024-001",
      period: "November 2024",
      generatedDate: "Dec 1, 2024",
      dueDate: "Dec 5, 2024",
      totalClasses: 48,
      totalAmount: 80000,
      platformFee: 16000,
      netAmount: 64000,
      status: PaymentStatus.PENDING,
      classes: [
        {
          name: "Advanced Mathematics",
          schedule: "Every Monday & Wednesday",
          sessions: 8,
          amount: 40000
        },
        {
          name: "Physics Fundamentals",
          schedule: "Every Tuesday & Thursday",
          sessions: 8,
          amount: 40000
        }
      ]
    },
    {
      id: "PAY-2024-002",
      period: "October 2024",
      generatedDate: "Nov 1, 2024",
      dueDate: "Nov 5, 2024",
      paidDate: "Nov 3, 2024",
      totalClasses: 52,
      totalAmount: 85000,
      platformFee: 17000,
      netAmount: 68000,
      status: PaymentStatus.VERIFIED, 
      transactionId: "TXN-123456",
      classes: [
        {
          name: "Advanced Mathematics",
          schedule: "Every Monday & Wednesday",
          sessions: 9,
          amount: 45000
        },
        {
          name: "Physics Fundamentals",
          schedule: "Every Tuesday & Thursday",
          sessions: 8,
          amount: 40000
        }
      ]
    }
  ];

  return (
    <div className="p-6 max-w-6xl xl:min-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="thisWeek">This Week</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">This Month&apos;s Earnings</p>
              <p className="text-2xl font-bold">Rs. 64,000</p>
              <p className="text-sm text-gray-600">From 48 classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-amber-600">Rs. 64,000</p>
              <p className="text-sm text-gray-600">Due on Dec 5, 2024</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Last Month</p>
              <p className="text-2xl font-bold text-green-600">Rs. 68,000</p>
              <p className="text-sm text-gray-600">From 52 classes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        {payments.map((payment) => (
          <TutorPaymentCard 
            key={payment.id} 
            payment={payment}
            onViewInvoice={(payment) => setSelectedInvoice(payment)}
          />
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Dialog */}
      {selectedInvoice && (
        <InvoiceDialog 
          selectedInvoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default TutorPayments;