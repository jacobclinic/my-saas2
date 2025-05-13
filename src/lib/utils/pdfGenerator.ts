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
