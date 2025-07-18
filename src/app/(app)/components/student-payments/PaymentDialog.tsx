'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import {
  DollarSign,
  Upload,
  MessageCircle,
  Clock,
  Info,
  Building,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { uploadPaymentSlipAction } from '~/lib/student-payments/server-actions';
import { getFileBuffer } from '~/lib/utils/upload-material-utils';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'error' | 'complete' | 'waiting';
  error?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  sessionData: SessionStudentTableData;
  studentId: string;
  onPaymentSuccess?: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  sessionData,
  studentId,
  onPaymentSuccess,
}) => {
  const csrfToken = useCsrfToken();
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  console.log(
    '-----PaymentDialog-------sessionData:',
    sessionData.sessionRawData?.start_time?.slice(0, 7),
  );

  const bankDetails = {
    bankName: 'Hatton National Bank',
    accountName: 'Comma Education (PVT) LTD',
    accountNumber: '227010004378',
    branch: 'Karapitiya',
  };

  const whatsappNumber = '+94716751777';
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1MB = 1 * 1024 * 1024 bytes)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setUploadingFile({
        file,
        progress: 0,
        status: 'error',
        error: 'File is too large. Please use a file smaller than 1MB.',
      });
      return;
    }

    // Check file type
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadingFile({
        file,
        progress: 0,
        status: 'error',
        error:
          'Invalid file format. Please use PNG, JPEG, JPG, or PDF files only.',
      });
      return;
    }

    try {
      setUploadingFile({
        file,
        progress: 0,
        status: 'uploading',
      });

      // Convert file to buffer
      const buffer = await getFileBuffer(file);

      setUploadingFile((prev) => (prev ? { ...prev, progress: 50 } : null));

      // payment period is the date of the session eg: 2025-02
      const paymentPeriod = sessionData.sessionRawData?.start_time?.slice(0, 7);

      if (!paymentPeriod) {
        throw new Error('Payment period not found');
      }

      // Upload to server
      const result = await uploadPaymentSlipAction({
        studentId,
        classId: sessionData.classId || '',
        paymentPeriod,
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          buffer: Array.from(new Uint8Array(buffer)),
        },
        csrfToken,
      });
      if (result.success) {
        setUploadingFile((prev) =>
          prev
            ? {
                ...prev,
                status: 'complete',
                progress: 100,
              }
            : null,
        );

        // Call the success callback to update parent state
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }

        // Show success message and close dialog after delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.log(error);

      // Enhanced error messaging
      let errorMessage = 'Upload failed. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Body exceeded')) {
          errorMessage =
            'File is too large. Please use a file smaller than 1MB.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('Network')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else if (
          error.message.includes('timeout') ||
          error.message.includes('Timeout')
        ) {
          errorMessage =
            'Upload timed out. Please try again with a smaller file.';
        } else if (
          error.message.includes('format') ||
          error.message.includes('type')
        ) {
          errorMessage =
            'Invalid file format. Please use PNG, JPEG, JPG, or PDF files only.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setUploadingFile((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: errorMessage,
            }
          : null,
      );
    }
  };

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

  // Function to extract month and year
  const getMonthAndYear = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // Adding 1 because getMonth() returns 0-11
    const year = date.getFullYear();

    // Optionally, get the month name instead of the number
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
    const monthName = monthNames[date.getMonth()];

    return { year, monthName };
  };

  const { year, monthName } = getMonthAndYear(sessionData.date);

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
              <p className="text-sm text-gray-600">
                {year} {monthName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium">
                Rs. {sessionData.paymentAmount}
              </div>
              <div>
                <p className="text-xs text-amber-600">
                  Payment Due: 8 {monthName} {year}
                </p>
              </div>
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
                <div className="font-medium">{bankDetails.bankName}</div>
                <div className="text-gray-600">Account Name:</div>
                <div className="font-medium">{bankDetails.accountName}</div>
                <div className="text-gray-600">Account Number:</div>
                <div className="font-medium">{bankDetails.accountNumber}</div>
                <div className="text-gray-600">Branch:</div>
                <div className="font-medium">{bankDetails.branch}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Upload Section */}
        <div className="space-y-4">
          <h2 className="font-medium">Submit Payment Proof</h2>

          <div>
            <input
              type="file"
              id="receipt"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById('receipt')?.click()}
              disabled={uploadingFile?.status === 'uploading'}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingFile?.status === 'uploading'
                ? `Uploading... ${uploadingFile.progress}%`
                : 'Upload Payment Receipt'}
            </Button>

            {uploadingFile && (
              <div className="mt-2">
                {uploadingFile.status === 'complete' && (
                  <p className="text-sm text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Receipt uploaded successfully
                  </p>
                )}
                {uploadingFile.status === 'error' && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {uploadingFile.error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Option */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Or send via WhatsApp:</p>
            <Alert className="bg-green-50 border-green-200">
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <p className="text-green-800 font-medium">
                    WhatsApp: {whatsappNumber}
                  </p>
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
              onClick={() =>
                window.open(
                  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
                  '_blank',
                )
              }
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
            Need help? Contact our support team via WhatsApp or call +9471 67 51
            777
          </AlertDescription>
        </Alert>
      </div>
    </BaseDialog>
  );
};

export default PaymentDialog;
