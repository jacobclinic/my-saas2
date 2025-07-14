'use client';

import React, { useState } from 'react';
import { Button } from '../base-v2/ui/Button';
import { Textarea } from '../base-v2/ui/Textarea';
import { Badge } from '../base-v2/ui/Badge';
import {
  Calendar,
  User,
  Book,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import BaseDialog from '../base-v2/BaseDialog';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import {
  PaymentWithDetails,
  PaymentStatus,
} from '~/lib/payments/types/admin-payments';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { uploadPaymentSlipAction } from '~/lib/student-payments/server-actions';
import { getFileBuffer } from '~/lib/utils/upload-material-utils';
import { FileUploadItem } from '../base-v2/FileUploadItem';
import { toast } from 'sonner';

interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  payment: PaymentWithDetails;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string, reason: string) => void;
  onPaymentUpload?: (paymentId: string, url: string) => void; // Add callback for payment upload
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'error' | 'complete' | 'waiting';
  error?: string;
}

const PaymentDetailsDialog: React.FC<PaymentDetailsDialogProps> = ({
  open,
  onClose,
  payment,
  onApprove,
  onReject,
  onPaymentUpload,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(
    null,
  );
  const csrfToken = useCsrfToken();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(payment.id);
    } finally {
      setLoading(false);
    }
  };
  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setLoading(true);
    try {
      await onReject(payment.id, rejectionReason);
    } finally {
      setLoading(false);
      setShowRejectionForm(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile({
        file,
        progress: 0,
        status: 'uploading',
      });

      // Convert file to buffer
      const buffer = await getFileBuffer(file);

      setUploadingFile((prev) => (prev ? { ...prev, progress: 50 } : null));

      // Extract payment period from payment data (expecting format YYYY-MM)
      const paymentPeriod = payment.period;

      if (!paymentPeriod) {
        throw new Error('Payment period not found');
      }

      // Upload to server using the existing uploadPaymentSlipAction
      const result = await uploadPaymentSlipAction({
        studentId: payment.studentId,
        classId: payment.classId,
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
        ); // Call the callback if provided
        if (onPaymentUpload && result.url) {
          onPaymentUpload(payment.id, result.url);
        }

        // Show success toast
        toast.success('Payment proof uploaded successfully!');

        // Show success message and close upload after delay
        setTimeout(() => {
          setUploadingFile(null);
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload payment proof. Please try again.');
      setUploadingFile((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: 'Upload failed. Please try again.',
            }
          : null,
      );
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMMM yyyy');
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            Pending
          </Badge>
        );
      case PaymentStatus.PENDING_VERIFICATION:
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            Processing
          </Badge>
        );
      case PaymentStatus.VERIFIED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Verified
          </Badge>
        );
      case PaymentStatus.REJECTED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Rejected
          </Badge>
        );
      case PaymentStatus.NOT_PAID:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            Not Paid
          </Badge>
        );
    }
  };

  // Create customized footer based on payment status
  const renderFooter = () => {
    if (
      payment.status === PaymentStatus.PENDING ||
      payment.status === PaymentStatus.PENDING_VERIFICATION
    ) {
      return showRejectionForm ? (
        <div className="space-y-3 w-full">
          <Textarea
            placeholder="Provide a reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full h-24"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectionForm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || loading}
            >
              {loading ? 'Processing...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2 w-full">
          <Button
            variant="destructive"
            onClick={() => setShowRejectionForm(true)}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject Payment
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleApprove}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Payment
          </Button>
        </div>
      );
    }

    // For not_paid, verified, and rejected payments, just show a close button
    return <Button onClick={onClose}>Close</Button>;
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Payment Details - Invoice #${payment.invoiceNo || 'N/A'}`}
      maxWidth="2xl"
      footer={renderFooter()}
      contentClassName="space-y-6"
    >
      {/* Status Banner */}
      {payment.status === PaymentStatus.NOT_PAID && (
        <Alert className="bg-gray-50 border-gray-200">
          <AlertTriangle className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-700">
            No payment has been submitted for this invoice.
          </AlertDescription>
        </Alert>
      )}
      {(payment.status === PaymentStatus.VERIFIED ||
        payment.status === PaymentStatus.REJECTED) && (
        <Alert
          className={`${
            payment.status === PaymentStatus.VERIFIED
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {payment.status === PaymentStatus.VERIFIED ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={`${
              payment.status === PaymentStatus.VERIFIED
                ? 'text-green-700'
                : 'text-red-700'
            }`}
          >
            {payment.status === PaymentStatus.VERIFIED
              ? 'This payment has been verified.'
              : 'Payment was rejected.'}
          </AlertDescription>
        </Alert>
      )}
      {/* Processing Status */}
      {payment.status === PaymentStatus.PENDING_VERIFICATION && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            This payment is awaiting verification. Please review the payment
            proof before approving.
          </AlertDescription>
        </Alert>
      )}
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student & Class Details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium text-gray-900">
              Student & Class Details
            </h3>

            <div className="space-y-2">
              <div className="flex items-start">
                <User className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">{payment.studentName}</p>
                  <p className="text-sm text-gray-600">
                    Student ID: {payment.studentId}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Book className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">{payment.className}</p>
                  <p className="text-sm text-gray-600">
                    Class ID: {payment.classId}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Users className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">{payment.tutorName}</p>
                  <p className="text-sm text-gray-600">
                    Tutor ID: {payment.tutorId}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Invoice Details</h3>

            <div className="space-y-2">
              <div className="flex items-start">
                <DollarSign className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">
                    Rs. {payment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Invoice ID: {payment.id}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FileText className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">{payment.invoiceNo || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">{formatPeriod(payment.period)}</p>
                  <p className="text-sm text-gray-600">Invoice Period</p>
                </div>
              </div>

              <div className="flex items-start">
                <FileText className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">
                    {payment.invoiceDate
                      ? format(new Date(payment.invoiceDate), 'MMMM d, yyyy')
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                </div>
              </div>

              <div className="flex items-start">
                <FileText className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                <div>
                  <p className="font-medium">
                    {payment.submittedDate
                      ? format(
                          new Date(payment.submittedDate),
                          'MMMM d, yyyy h:mm a',
                        )
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Submission Date</p>
                </div>
              </div>

              <div className="flex items-center mt-1">
                <div className="font-medium mr-2">Status:</div>
                {getStatusBadge(payment.status)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>{' '}
      {/* Payment Proof */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Payment Proof</h3>

          {/* Admin Upload Button - Show for NOT_PAID or if no payment proof exists */}
          {(payment.status === PaymentStatus.NOT_PAID ||
            !payment.paymentProofUrl) && (
            <div>
              <input
                type="file"
                id="admin-payment-upload"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={uploadingFile?.status === 'uploading'}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById('admin-payment-upload')?.click()
                }
                disabled={uploadingFile?.status === 'uploading'}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingFile?.status === 'uploading'
                  ? 'Uploading...'
                  : 'Upload Payment Proof'}
              </Button>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadingFile && (
          <div className="mb-4">
            <FileUploadItem
              fileName={uploadingFile.file.name}
              fileSize={(uploadingFile.file.size / (1024 * 1024)).toFixed(2)}
              progress={uploadingFile.progress}
              status={uploadingFile.status}
              error={uploadingFile.error}
              onRemove={() => setUploadingFile(null)}
            />
          </div>
        )}

        {payment.paymentProofUrl ? (
          <div className="bg-gray-50 border rounded-lg p-1">
            <div className="relative overflow-hidden rounded">
              <a
                href={payment.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md"
              >
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </a>

              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6">
                <div className="text-center space-y-4">
                  <FileText className="h-12 w-12 mx-auto text-blue-500" />
                  <p className="text-gray-700">
                    Payment proof document available
                  </p>
                  <Button
                    variant="default"
                    onClick={() =>
                      window.open(payment.paymentProofUrl, '_blank')
                    }
                    className="inline-flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Payment Proof
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 italic">No payment proof available</p>
            {(payment.status === PaymentStatus.NOT_PAID ||
              !payment.paymentProofUrl) && (
              <p className="text-sm text-gray-400 mt-1">
                Use the upload button above to add payment proof for this
                student
              </p>
            )}
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

export default PaymentDetailsDialog;
