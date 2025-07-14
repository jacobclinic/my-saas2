import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define types for better type safety
export interface HeaderData {
  className: string;
  classDate: string;
  classTime: string;
  numberOfStudents: number;
}

export interface PDFGeneratorOptions {
  data: any[]; // The data to display in the table
  columnNames?: string[]; // Custom column names
  columnKeys?: string[]; // Keys to extract from data objects
  title?: string; // Custom PDF title
  headerData?: HeaderData; // Optional header data
  filename?: string; // Custom filename
}

/**
 * Legacy function maintained for backward compatibility
 */
export const generateStudentPDF = (students: any[], classDataName: string) => {
  return generateCustomPDF({
    data: students,
    title: `Registered Students - ${classDataName}`,
    columnNames: ['Name', 'Email', 'Phone Number'],
    columnKeys: ['name', 'email', 'phone_number'],
    filename: `Students_List_${classDataName}`,
  });
};

/**
 * Generate a customizable PDF with table data and optional header information
 */
export const generateCustomPDF = (options: PDFGeneratorOptions) => {
  const {
    data,
    columnNames = ['Name', 'Email', 'Phone Number'],
    columnKeys = ['name', 'email', 'phone_number'],
    title = 'Generated Report',
    headerData,
    filename = 'Generated_Report',
  } = options;

  if (data.length === 0) {
    alert('No data to export.');
    return;
  }

  const doc = new jsPDF();
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Starting Y position that will be updated as we add content
  let yPosition = 10;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, yPosition);
  yPosition += 10;

  // Add header data if provided
  if (headerData) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Class: ${headerData.className}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Date: ${headerData.classDate}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Time: ${headerData.classTime}`, 14, yPosition);
    yPosition += 5;
    doc.text(
      `Number of Students: ${headerData.numberOfStudents}`,
      14,
      yPosition,
    );
    yPosition += 10;
  }

  // Generate table rows from data using columnKeys
  const tableRows = data.map((item) => {
    return columnKeys.map((key) => {
      // Handle nested properties and missing values
      const value = key
        .split('.')
        .reduce(
          (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null),
          item,
        );
      return value || 'N/A';
    });
  });

  // Add table
  autoTable(doc, {
    startY: yPosition,
    head: [columnNames],
    body: tableRows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [22, 160, 133] }, // Custom table header color
  });

  // Save File
  doc.save(`${filename}_${currentDate}.pdf`);

  return doc; // Return doc object for potential further manipulation
};

/**
 * Generate a PDF invoice for a student
 */
export const generateInvoicePDF = (invoiceData: {
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
}) => {
  const doc = new jsPDF();
  const currentDate = new Date().toISOString().split('T')[0];

  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Helper function to format period
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  let yPos = 20;

  // Company Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Comma Education', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('123 Education Street', 20, yPos);
  yPos += 4;
  doc.text('Colombo, Sri Lanka', 20, yPos);
  yPos += 4;
  doc.text('Phone: +94716751777', 20, yPos);
  yPos += 4;
  doc.text('Email: info@commaeducation.com', 20, yPos);
  yPos += 15;

  // Invoice Title and Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('INVOICE', 20, yPos);

  // Invoice details on the right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Invoice #: ${invoiceData.invoice_no || invoiceData.id.slice(0, 8)}`,
    140,
    yPos - 5,
  );
  doc.text(`Date: ${formatDate(invoiceData.invoice_date)}`, 140, yPos + 2);
  doc.text(`Due Date: ${formatDate(invoiceData.due_date)}`, 140, yPos + 9);
  yPos += 25;

  // Student Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To:', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoiceData.student_name, 20, yPos);
  yPos += 5;
  doc.text(`Student ID: ${invoiceData.student_id}`, 20, yPos);
  yPos += 5;
  doc.text(`Class: ${invoiceData.class_name || 'Unknown Class'}`, 20, yPos);
  if (invoiceData.class_subject) {
    yPos += 5;
    doc.text(`Subject: ${invoiceData.class_subject}`, 20, yPos);
  }
  yPos += 15;

  // Invoice Period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Invoice Period:', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(formatPeriod(invoiceData.month), 20, yPos);
  yPos += 15;

  // Invoice Table
  const tableData = [
    ['Description', 'Amount'],
    [
      `Monthly Fee - ${invoiceData.class_name || 'Class'}`,
      `Rs. ${invoiceData.amount ? invoiceData.amount.toLocaleString() : '0'}`,
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [tableData[0]],
    body: [tableData[1]],
    styles: {
      fontSize: 10,
      cellPadding: 8,
      halign: 'left',
    },
    headStyles: {
      fillColor: [22, 160, 133],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' },
    },
    theme: 'grid',
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 30;

  // Total Amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount:', 120, finalY + 15);
  doc.text(
    `Rs. ${invoiceData.amount ? invoiceData.amount.toLocaleString() : '0'}`,
    160,
    finalY + 15,
  );

  // Payment Status
  yPos = finalY + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Payment Status:', 20, yPos);
  doc.setFont('helvetica', 'normal');

  let statusText = '';
  switch (invoiceData.payment_status) {
    case 'completed':
      statusText = 'PAID';
      break;
    case 'pending':
      statusText = 'PENDING';
      break;
    case 'not_paid':
      statusText = 'UNPAID';
      break;
    default:
      statusText = 'UNKNOWN';
  }
  doc.text(statusText, 55, yPos);

  // Footer
  yPos += 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Thank you for choosing Comma Education!', 20, yPos);
  doc.text(
    'For any queries, please contact us at info@commaeducation.com',
    20,
    yPos + 5,
  );

  // Save the PDF
  const filename = `Invoice_${invoiceData.invoice_no || invoiceData.id.slice(0, 8)}_${currentDate}`;
  doc.save(`${filename}.pdf`);

  return doc;
};
