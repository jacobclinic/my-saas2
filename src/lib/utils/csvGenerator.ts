import { CSVHeaderData } from '../types/generator';

// Define types for better type safety
export type HeaderData = CSVHeaderData; // Re-export for backward compatibility

export interface CSVGeneratorOptions {
  data: any[]; // The data to display in the CSV
  columnNames?: string[]; // Custom column names
  columnKeys?: string[]; // Keys to extract from data objects
  fileName?: string; // File name for download
  headerData?: HeaderData; // Optional header data
  includeMetadata?: boolean; // Whether to include metadata header
}

/**
 * Legacy function maintained for backward compatibility
 */
export const generateStudentCSV = (
  students: any[],
  classDataName: string,
  headerData?: HeaderData,
) => {
  return generateCustomCSV({
    data: students,
    columnNames: ['Name', 'Email', 'Phone Number', 'Address'],
    columnKeys: ['name', 'email', 'phone_number', 'address'],
    fileName: `Students_List_${classDataName}`,
    headerData: headerData || {
      className: classDataName,
      numberOfStudents: students.length,
    },
    includeMetadata: true,
  });
};

/**
 * Generate a customizable CSV with data and optional header information
 */
export const generateCustomCSV = (options: CSVGeneratorOptions) => {
  const {
    data,
    columnNames = ['Name', 'Email', 'Phone Number', 'Address'],
    columnKeys = ['name', 'email', 'phone_number', 'address'],
    fileName = 'Generated_Report',
    headerData,
    includeMetadata = false,
  } = options;

  if (data.length === 0) {
    alert('No data to export.');
    return;
  }

  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  let csvContent = '';

  // Add metadata header if requested and headerData is provided
  if (includeMetadata && headerData) {
    csvContent += `Class Information\n`;
    csvContent += `Class Name,${escapeCSVValue(headerData.className)}\n`;
    if (headerData.tutorName) {
      csvContent += `Tutor Name,${escapeCSVValue(headerData.tutorName)}\n`;
    }
    if (headerData.subject) {
      csvContent += `Subject,${escapeCSVValue(headerData.subject)}\n`;
    }
    if (headerData.grade) {
      csvContent += `Grade,${escapeCSVValue(headerData.grade)}\n`;
    }
    if (headerData.classDate) {
      csvContent += `Class Date,${escapeCSVValue(headerData.classDate)}\n`;
    }
    if (headerData.classTime) {
      csvContent += `Class Time,${escapeCSVValue(headerData.classTime)}\n`;
    }
    csvContent += `Number of Students,${headerData.numberOfStudents}\n`;
    csvContent += `Downloaded Date,${headerData.downloadDate || currentDate}\n`;
    csvContent += '\n'; // Empty line to separate metadata from data
  }

  // Add column headers
  csvContent +=
    columnNames.map((name) => escapeCSVValue(name)).join(',') + '\n';

  // Add data rows
  data.forEach((item) => {
    const row = columnKeys.map((key) => {
      // Handle nested properties and missing values
      const value = key
        .split('.')
        .reduce(
          (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null),
          item,
        );

      // Special handling for address field
      if (key === 'address') {
        return escapeCSVValue(
          value && value.trim() ? value : 'no known address',
        );
      }

      return escapeCSVValue(value || 'N/A');
    });
    csvContent += row.join(',') + '\n';
  });

  // Create and download the CSV file
  downloadCSV(csvContent, `${fileName}_${currentDate}.csv`);

  return csvContent; // Return CSV content for potential further manipulation
};

/**
 * Escape CSV values to handle commas, quotes, and newlines
 */
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, double quote, or newline, wrap it in quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    // Escape any existing double quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }

  return stringValue;
};

/**
 * Download CSV content as a file
 */
const downloadCSV = (content: string, filename: string) => {
  // Create a blob with the CSV content
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  // Add to DOM, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Generate a CSV for invoice data
 */
export const generateInvoiceCSV = (invoiceData: {
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

  const csvData = [
    {
      invoice_number: invoiceData.invoice_no || invoiceData.id.slice(0, 8),
      student_name: invoiceData.student_name,
      student_id: invoiceData.student_id,
      class_name: invoiceData.class_name || 'Unknown Class',
      class_subject: invoiceData.class_subject || 'N/A',
      period: formatPeriod(invoiceData.month),
      amount: invoiceData.amount
        ? `Rs. ${invoiceData.amount.toLocaleString()}`
        : 'Rs. 0',
      payment_status: invoiceData.payment_status.toUpperCase(),
      invoice_date: formatDate(invoiceData.invoice_date),
      due_date: formatDate(invoiceData.due_date),
      export_date: currentDate,
    },
  ];

  return generateCustomCSV({
    data: csvData,
    columnNames: [
      'Invoice Number',
      'Student Name',
      'Student ID',
      'Class Name',
      'Subject',
      'Period',
      'Amount',
      'Payment Status',
      'Invoice Date',
      'Due Date',
      'Export Date',
    ],
    columnKeys: [
      'invoice_number',
      'student_name',
      'student_id',
      'class_name',
      'class_subject',
      'period',
      'amount',
      'payment_status',
      'invoice_date',
      'due_date',
      'export_date',
    ],
    fileName: `Invoice_${invoiceData.invoice_no || invoiceData.id.slice(0, 8)}`,
    includeMetadata: false,
  });
};
