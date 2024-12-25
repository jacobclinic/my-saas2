'use client'

import React from 'react';
import { InvoiceDialogProps, Payment, PaymentCardProps } from '~/lib/payments/types/tutor-payments';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../base-v2/ui/Dialog";
import { Download } from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({ selectedInvoice, onClose }) => {
  if (!selectedInvoice) return null;

  const handleDownloadInvoice = () => {
    // Implement invoice download logic
    console.log('Downloading invoice:', selectedInvoice.id);
  };

  const handleDownloadReceipt = () => {
    // Implement receipt download logic
    console.log('Downloading receipt for transaction:', selectedInvoice.transactionId);
  };

  const dialogContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">Payment #{selectedInvoice.id}</h3>
              <p className="text-sm text-gray-600">{selectedInvoice.period}</p>
            </div>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Generated Date</p>
              <p className="font-medium">{selectedInvoice.generatedDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-medium">{selectedInvoice.dueDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-medium ${
                selectedInvoice.status === 'paid' ? 'text-green-600' : 'text-amber-600'
              }`}>
                {selectedInvoice.status === 'paid' ? 'Paid' : 'Pending'}
              </p>
            </div>
            {selectedInvoice.status === 'paid' && (
              <div>
                <p className="text-sm text-gray-600">Payment Date</p>
                <p className="font-medium">{selectedInvoice.paidDate}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Payment Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">Rs. {selectedInvoice.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Fee (20%):</span>
                <span>Rs. {selectedInvoice.platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-green-600 pt-2 border-t">
                <span>Net Amount:</span>
                <span>Rs. {selectedInvoice.netAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Classes Conducted</h4>
            <div className="space-y-2">
              {selectedInvoice.classes.map((cls, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-gray-600">{cls.schedule}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{cls.sessions} sessions</p>
                    <p className="text-sm text-gray-600">Rs. {cls.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedInvoice.status === 'paid' && selectedInvoice.transactionId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-gray-600">Transaction ID: {selectedInvoice.transactionId}</p>
              </div>
              <Button variant="outline" onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <BaseDialog
      open={!!selectedInvoice}
      onClose={onClose}
      title="Payment Details"
      maxWidth="2xl"
      showCloseButton
      closeButtonText="Close"
    >
      {dialogContent}
    </BaseDialog>
  );
};

export default InvoiceDialog;