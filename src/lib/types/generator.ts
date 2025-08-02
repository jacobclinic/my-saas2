/**
 * Header data interface for CSV and PDF generation
 * Contains common fields that can be extended for specific use cases
 */
export interface BaseHeaderData {
  className: string;
  classDate?: string;
  classTime?: string;
  numberOfStudents: number;
  downloadDate?: string;
}

/**
 * Extended header data interface for CSV generation with additional fields
 */
export interface CSVHeaderData extends BaseHeaderData {
  tutorName?: string;
  subject?: string;
  grade?: string;
}

/**
 * Header data interface for PDF generation
 */
export interface PDFHeaderData extends BaseHeaderData {
  classDate: string; // Required for PDF
  classTime: string; // Required for PDF
}
