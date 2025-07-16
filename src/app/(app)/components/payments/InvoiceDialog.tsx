import { Download, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../base-v2/ui/Dialog';
import { Separator } from '../base-v2/ui/separator';
import { Button } from '../base-v2/ui/Button';
import { generateCustomPDF } from '../../../../lib/utils/pdfGenerator';

interface InvoiceViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    classTitle: string;
    date: string;
    students: number;
    paidStudents?: number;
    classFee?: number;
  };
}

export function InvoiceView({ open, onOpenChange, invoice }: InvoiceViewProps) {
  const commissionRate = 0.15; // 15% commission
  // Monthly fee per student should always come from classFee
  const monthlyFeePerStudent = invoice.classFee || 0;

  // Use paid students count from database (invoices table with status = 'paid')
  const paidStudents = invoice.paidStudents || 0;

  // Calculate total amount based on paid students only
  const totalAmount = monthlyFeePerStudent * paidStudents;

  // Use total amount for commission and tutor amount calculations
  const commissionAmount = totalAmount * commissionRate;
  const tutorAmount = totalAmount - commissionAmount;

  const handleDownloadPDF = () => {
    // Prepare invoice data for PDF generation
    const invoiceData = [
      {
        description: `Monthly Fee - ${invoice.classTitle}`,
        amount: `Rs. ${monthlyFeePerStudent.toFixed(2)}`,
        students: `× ${paidStudents}`,
        total: `Rs. ${totalAmount.toFixed(2)}`,
        commission: `- Rs. ${commissionAmount.toFixed(2)}`,
        netAmount: `Rs. ${tutorAmount.toFixed(2)}`,
      },
    ];

    generateCustomPDF({
      data: invoiceData,
      title: 'Invoice Details',
      columnNames: [
        'Description',
        'Amount',
        'Students',
        'Total',
        'Commission (15%)',
        'Net Amount',
      ],
      columnKeys: [
        'description',
        'amount',
        'students',
        'total',
        'commission',
        'netAmount',
      ],
      filename: `Invoice_${invoice.id}`,
      headerData: {
        className: invoice.classTitle,
        classDate: invoice.date,
        classTime: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        numberOfStudents: invoice.students,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">Comma Education</h3>
              <p className="text-sm text-neutral-600">
                76/A Sri Hemananda Street, Bataganwila
              </p>
              <p className="text-sm text-neutral-600">Galle, Sri Lanka</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Invoice #{invoice.id}</p>
              <p className="text-sm text-neutral-600">{invoice.date}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Class Details</h4>
              <p className="text-sm">{invoice.classTitle}</p>
              <p className="text-sm text-neutral-600">
                Number of Students: {invoice.students}
              </p>
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly Fee</span>
                  <span className="text-sm">
                    Rs. {monthlyFeePerStudent.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Paid Students</span>
                  <span className="text-sm">× {paidStudents}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-medium">
                    Rs. {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center text-neutral-600">
                  <span className="text-sm">
                    Comma Education Commission (15%)
                  </span>
                  <span className="text-sm">
                    - Rs. {commissionAmount.toFixed(2)}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-success-dark">
                    Net Amount (Tutor)
                  </span>
                  <span className="font-medium text-success-dark">
                    Rs. {tutorAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {/* <Button
              variant="outline"
              className="text-neutral-700"
              onClick={() => window.print()}
            >
              <Printer size={16} className="mr-2" />
              Print
            </Button> */}{' '}
            <Button
              className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white"
              onClick={handleDownloadPDF}
            >
              <Download size={16} className="mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
