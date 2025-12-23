import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentResult {
  id: string;
  student_name: string;
  roll_number: string;
  class_name: string;
  academic_year: string;
  department: string;
  semester: string;
  institution_type: 'school' | 'college';
  subjects: string[];
  marks: number[];
  total_marks: number;
  percentage: number;
  grade: string;
  remarks: string | null;
  created_at: string;
}

export function exportToPDF(result: StudentResult) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header gradient effect (simulated with rectangles)
  doc.setFillColor(99, 102, 241); // Indigo
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ELITE STUDENT RESULT PORTAL', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${result.institution_type === 'school' ? 'School' : 'College'} Result Card`, pageWidth / 2, 32, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Academic Year: ${result.academic_year}`, pageWidth / 2, 42, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Student Info Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 14, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const studentInfo = [
    ['Student Name:', result.student_name, 'Roll Number:', result.roll_number],
    ['Class/Grade:', result.class_name, 'Department:', result.department || 'N/A'],
    ['Semester/Term:', result.semester, 'Date:', new Date(result.created_at).toLocaleDateString()]
  ];
  
  let yPos = 75;
  studentInfo.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 50, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(row[3], 146, yPos);
    yPos += 8;
  });
  
  // Marks Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject-wise Marks', 14, yPos + 10);
  
  const tableData = result.subjects.map((subject, index) => {
    const mark = result.marks[index];
    const status = mark >= 40 ? 'PASS' : 'FAIL';
    return [index + 1, subject, mark.toString(), '100', status];
  });
  
  autoTable(doc, {
    startY: yPos + 15,
    head: [['S.No', 'Subject', 'Marks Obtained', 'Max Marks', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      halign: 'center',
      valign: 'middle',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 }
    }
  });
  
  // Results Summary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, pageWidth - 28, 45, 3, 3, 'F');
  doc.setDrawColor(99, 102, 241);
  doc.roundedRect(14, finalY, pageWidth - 28, 45, 3, 3, 'S');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Result Summary', 20, finalY + 12);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryY = finalY + 22;
  doc.text(`Total Marks: ${result.total_marks} / ${result.subjects.length * 100}`, 20, summaryY);
  doc.text(`Percentage: ${result.percentage}%`, 80, summaryY);
  
  // Grade Badge
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(140, summaryY - 6, 50, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grade: ${result.grade}`, 165, summaryY + 2, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Remarks: ${result.remarks || 'N/A'}`, 20, summaryY + 12);
  doc.text(`Result: ${result.percentage >= 40 ? 'PASSED' : 'FAILED'}`, 100, summaryY + 12);
  
  // Footer
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 280, pageWidth, 17, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, 287, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 293, { align: 'center' });
  
  // Save PDF
  doc.save(`Result_${result.student_name.replace(/\s+/g, '_')}_${result.roll_number}.pdf`);
}

export function exportAllToCSV(results: StudentResult[], filename: string = 'student_results') {
  if (results.length === 0) return;
  
  const headers = [
    'Student Name',
    'Roll Number',
    'Class',
    'Department',
    'Semester',
    'Academic Year',
    'Institution Type',
    'Total Marks',
    'Percentage',
    'Grade',
    'Remarks',
    'Created Date',
    ...Array.from({ length: 10 }, (_, i) => [`Subject ${i + 1}`, `Marks ${i + 1}`]).flat()
  ];
  
  const rows = results.map(result => {
    const subjectMarks: string[] = [];
    for (let i = 0; i < 10; i++) {
      subjectMarks.push(result.subjects[i] || '');
      subjectMarks.push(result.marks[i]?.toString() || '');
    }
    
    return [
      result.student_name,
      result.roll_number,
      result.class_name,
      result.department,
      result.semester,
      result.academic_year,
      result.institution_type,
      result.total_marks.toString(),
      result.percentage.toString(),
      result.grade,
      result.remarks || '',
      new Date(result.created_at).toLocaleDateString(),
      ...subjectMarks
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportSingleToCSV(result: StudentResult) {
  exportAllToCSV([result], `Result_${result.student_name.replace(/\s+/g, '_')}`);
}
