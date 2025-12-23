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

function drawPieChart(doc: jsPDF, x: number, y: number, radius: number, data: { value: number; color: number[] }[]) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let startAngle = -Math.PI / 2;
  
  data.forEach(segment => {
    const sweepAngle = (segment.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sweepAngle;
    
    // Draw pie segment
    doc.setFillColor(segment.color[0], segment.color[1], segment.color[2]);
    
    // Create arc path
    const steps = 20;
    const points: [number, number][] = [[x, y]];
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (sweepAngle * i / steps);
      points.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)]);
    }
    points.push([x, y]);
    
    // Draw filled polygon
    doc.setDrawColor(255, 255, 255);
    const xPoints = points.map(p => p[0]);
    const yPoints = points.map(p => p[1]);
    
    // Use lines to draw the segment
    doc.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      doc.lineTo(points[i][0], points[i][1]);
    }
    doc.fill();
    
    startAngle = endAngle;
  });
}

function drawBarChart(doc: jsPDF, x: number, y: number, width: number, height: number, data: { label: string; value: number; color: number[] }[]) {
  const maxValue = 100;
  const barWidth = (width - 10) / data.length - 4;
  const chartHeight = height - 20;
  
  // Draw axis
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(x, y, x, y + chartHeight);
  doc.line(x, y + chartHeight, x + width - 10, y + chartHeight);
  
  // Draw bars
  data.forEach((bar, index) => {
    const barHeight = (bar.value / maxValue) * chartHeight;
    const barX = x + 5 + index * (barWidth + 4);
    const barY = y + chartHeight - barHeight;
    
    doc.setFillColor(bar.color[0], bar.color[1], bar.color[2]);
    doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');
    
    // Label
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    const shortLabel = bar.label.length > 6 ? bar.label.substring(0, 5) + '..' : bar.label;
    doc.text(shortLabel, barX + barWidth / 2, y + chartHeight + 8, { align: 'center' });
    
    // Value on top
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(bar.value.toString(), barX + barWidth / 2, barY - 2, { align: 'center' });
  });
}

export function exportToPDF(result: StudentResult) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header gradient effect
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ELITE STUDENT RESULT PORTAL', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${result.institution_type === 'school' ? 'School' : 'College'} Result Card`, pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Academic Year: ${result.academic_year}`, pageWidth / 2, 38, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Student Info Section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, 50, pageWidth - 20, 32, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 15, 60);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const col1X = 15, col2X = 75, col3X = 115, col4X = 160;
  let infoY = 68;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', col1X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(result.student_name, col1X + 15, infoY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Roll No:', col2X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(result.roll_number, col2X + 18, infoY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Class:', col3X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(result.class_name, col3X + 15, infoY);
  
  infoY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Dept:', col1X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(result.department || 'N/A', col1X + 13, infoY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Semester:', col2X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(result.semester, col2X + 22, infoY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', col3X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(result.created_at).toLocaleDateString(), col3X + 13, infoY);
  
  // Marks Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject-wise Performance', 15, 92);
  
  const tableData = result.subjects.map((subject, index) => {
    const mark = result.marks[index];
    const status = mark >= 40 ? 'PASS' : 'FAIL';
    const grade = mark >= 90 ? 'A+' : mark >= 80 ? 'A' : mark >= 70 ? 'B' : mark >= 60 ? 'C' : mark >= 40 ? 'D' : 'F';
    return [index + 1, subject, mark.toString(), '100', grade, status];
  });
  
  autoTable(doc, {
    startY: 96,
    head: [['S.No', 'Subject', 'Marks', 'Max', 'Grade', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      halign: 'center',
      valign: 'middle',
      fontSize: 9,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 55, halign: 'left' },
      2: { cellWidth: 20 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20 }
    }
  });
  
  const tableEndY = (doc as any).lastAutoTable.finalY;
  
  // Performance Analytics Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Analytics', 15, tableEndY + 12);
  
  // Subject Performance Bar Chart
  const chartY = tableEndY + 18;
  const chartWidth = 90;
  const chartHeight = 50;
  
  // Chart background
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(12, chartY - 2, chartWidth + 8, chartHeight + 18, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject-wise Marks', 15, chartY + 4);
  
  const barData = result.subjects.map((subject, index) => {
    const mark = result.marks[index];
    const color = mark >= 80 ? [34, 197, 94] : mark >= 60 ? [59, 130, 246] : mark >= 40 ? [251, 191, 36] : [239, 68, 68];
    return { label: subject, value: mark, color };
  });
  
  drawBarChart(doc, 15, chartY + 8, chartWidth, chartHeight, barData);
  
  // Performance Summary Circle
  const summaryX = 125;
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(summaryX - 3, chartY - 2, 78, chartHeight + 18, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary', summaryX, chartY + 4);
  
  // Draw percentage circle
  const circleX = summaryX + 20;
  const circleY = chartY + 32;
  const circleRadius = 18;
  
  // Background circle
  doc.setFillColor(229, 231, 235);
  doc.circle(circleX, circleY, circleRadius, 'F');
  
  // Foreground circle (percentage)
  const percentColor = result.percentage >= 80 ? [34, 197, 94] : result.percentage >= 60 ? [59, 130, 246] : result.percentage >= 40 ? [251, 191, 36] : [239, 68, 68];
  doc.setFillColor(percentColor[0], percentColor[1], percentColor[2]);
  doc.circle(circleX, circleY, circleRadius - 4, 'F');
  
  // Inner white circle
  doc.setFillColor(255, 255, 255);
  doc.circle(circleX, circleY, circleRadius - 8, 'F');
  
  // Percentage text
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`${result.percentage}%`, circleX, circleY + 1, { align: 'center' });
  
  // Stats next to circle
  const statsX = summaryX + 45;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total: ${result.total_marks}/${result.subjects.length * 100}`, statsX, chartY + 20);
  doc.text(`Grade: ${result.grade}`, statsX, chartY + 28);
  doc.text(`Subjects: ${result.subjects.length}`, statsX, chartY + 36);
  doc.text(`Pass: ${result.marks.filter(m => m >= 40).length}/${result.subjects.length}`, statsX, chartY + 44);
  
  // Result Summary Box
  const summaryY = chartY + chartHeight + 22;
  
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(12, summaryY, pageWidth - 24, 28, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FINAL RESULT', pageWidth / 2, summaryY + 8, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const resultText = `Total Marks: ${result.total_marks}/${result.subjects.length * 100}  |  Percentage: ${result.percentage}%  |  Grade: ${result.grade}  |  Result: ${result.percentage >= 40 ? 'PASSED' : 'FAILED'}`;
  doc.text(resultText, pageWidth / 2, summaryY + 17, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text(`Remarks: ${result.remarks || 'N/A'}`, pageWidth / 2, summaryY + 24, { align: 'center' });
  
  // Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 280, pageWidth, 17, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, 286, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()} | Elite Student Result Portal`, pageWidth / 2, 292, { align: 'center' });
  
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
