'use client'

import React, { useState } from 'react';
import { Card, CardContent } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { DollarSign, Upload, MessageCircle, Clock, Info, Building, Copy, Check } from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  sessionData: {
    id: string | number;
    name: string;
    date: string;
    time: string;
    paymentAmount?: number;
  };
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  sessionData
}) => {
  const [uploadedReceipt, setUploadedReceipt] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const whatsappMessage = 
    `Payment Details:\n` +
    `Class: ${sessionData.name}\n` +
    `Date: ${sessionData.date}\n` +
    `Time: ${sessionData.time}\n` +
    `Amount: Rs. ${sessionData?.paymentAmount}`;

  const copyWhatsappMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Payment Details"
      maxWidth="lg"
      showCloseButton={true}
    >
      <div className="space-y-6">
        {/* Payment Details */}
        <div className="bg-amber-50 p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-medium">{sessionData.name}</h2>
              <p className="text-sm text-gray-600">{sessionData.date}</p>
              <p className="text-sm text-gray-600">{sessionData.time}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium">Rs. {sessionData.paymentAmount}</div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-3">
          <h2 className="font-medium flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Bank Details
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Bank:</div>
                <div className="font-medium">Commercial Bank</div>
                <div className="text-gray-600">Account Name:</div>
                <div className="font-medium">Comma Education</div>
                <div className="text-gray-600">Account Number:</div>
                <div className="font-medium">1234567890</div>
                <div className="text-gray-600">Branch:</div>
                <div className="font-medium">Colombo</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Options */}
        <div className="space-y-4">
          <h2 className="font-medium">Submit Payment Proof</h2>
          
          {/* Direct Upload */}
          <div>
            <input
              type="file"
              id="receipt"
              className="hidden"
              accept="image/*"
              onChange={(e) => setUploadedReceipt(e.target.files?.[0] || null)}
            />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => document.getElementById('receipt')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Payment Receipt
            </Button>
            {uploadedReceipt && (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Receipt uploaded successfully
              </p>
            )}
          </div>

          {/* WhatsApp Option */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Or send via WhatsApp:</p>
            <Alert className="bg-green-50 border-green-200">
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <p className="text-green-800 font-medium">WhatsApp: +94 XX XXX XXXX</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-green-700"
                    onClick={copyWhatsappMessage}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="text-xs text-green-800 bg-green-100 p-2 rounded">
                  {whatsappMessage}
                </pre>
              </div>
            </Alert>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`https://wa.me/94XXXXXXXX?text=${encodeURIComponent(whatsappMessage)}`, '_blank')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Need help? Contact our support team via WhatsApp or call +94 XX XXX XXXX
          </AlertDescription>
        </Alert>
      </div>
    </BaseDialog>
  );
};

export default PaymentDialog;