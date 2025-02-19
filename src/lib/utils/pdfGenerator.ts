import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateStudentPDF = (students: any[], classDataName: string) => {
  if (students.length === 0) {
    alert("No students to export.");
    return;
  }

  const doc = new jsPDF();
  const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Registered Students - ${classDataName}`, 14, 10);

  // Table Columns
  const tableColumn = ["Name", "Email", "Phone Number"];
  const tableRows = students.map((student) => [
    student.name,
    student.email,
    student.phone_number || "N/A",
  ]);

  // Add table
  autoTable(doc, {
    startY: 20,
    head: [tableColumn],
    body: tableRows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [22, 160, 133] }, // Custom table header color
  });

  // Save File
  doc.save(`Students_List_${classDataName}_${currentDate}.pdf`);
};
