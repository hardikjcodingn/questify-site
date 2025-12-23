import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionType: 'school' | 'college';
  userId: string;
  onImportComplete: () => void;
}

interface ImportRow {
  student_name: string;
  roll_number: string;
  class_name: string;
  department?: string;
  semester: string;
  academic_year: string;
  subjects: string[];
  marks: number[];
  isValid: boolean;
  errors: string[];
}

function calculateGrade(percentage: number): { grade: string; remarks: string } {
  if (percentage >= 90) return { grade: 'A+', remarks: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', remarks: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', remarks: 'Good' };
  if (percentage >= 60) return { grade: 'C', remarks: 'Average' };
  if (percentage >= 40) return { grade: 'D', remarks: 'Below Average' };
  return { grade: 'F', remarks: 'Fail' };
}

export default function BulkImportDialog({ open, onOpenChange, institutionType, userId, onImportComplete }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      'Student Name', 'Roll Number', 'Class', 'Department', 'Semester', 'Academic Year',
      'Subject 1', 'Marks 1', 'Subject 2', 'Marks 2', 'Subject 3', 'Marks 3',
      'Subject 4', 'Marks 4', 'Subject 5', 'Marks 5', 'Subject 6', 'Marks 6',
      'Subject 7', 'Marks 7', 'Subject 8', 'Marks 8', 'Subject 9', 'Marks 9',
      'Subject 10', 'Marks 10'
    ];

    const sampleData = [
      ['John Doe', 'R001', '10th', 'Science', 'Term 1', '2024-25', 'Mathematics', 85, 'English', 78, 'Science', 92, 'Social Studies', 76, 'Hindi', 80, '', '', '', '', '', '', '', '', '', ''],
      ['Jane Smith', 'R002', '10th', 'Commerce', 'Term 1', '2024-25', 'Mathematics', 72, 'English', 88, 'Accountancy', 90, 'Business Studies', 82, 'Economics', 78, '', '', '', '', '', '', '', '', '', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Set column widths
    ws['!cols'] = headers.map((_, i) => ({ wch: i === 0 ? 20 : 15 }));
    
    XLSX.writeFile(wb, `student_results_template_${institutionType}.xlsx`);
    toast.success('Template downloaded!');
  };

  const parseFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setImportStats(null);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        toast.error('File is empty or has no data rows');
        return;
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

      const parsedRows: ImportRow[] = rows.map((row, idx) => {
        const errors: string[] = [];
        
        const studentName = row[0]?.toString().trim() || '';
        const rollNumber = row[1]?.toString().trim() || '';
        const className = row[2]?.toString().trim() || '';
        const department = row[3]?.toString().trim() || '';
        const semester = row[4]?.toString().trim() || '';
        const academicYear = row[5]?.toString().trim() || '';

        if (!studentName) errors.push('Missing student name');
        if (!rollNumber) errors.push('Missing roll number');
        if (!className) errors.push('Missing class');
        if (!semester) errors.push('Missing semester');
        if (!academicYear) errors.push('Missing academic year');

        const subjects: string[] = [];
        const marks: number[] = [];

        for (let i = 6; i < row.length; i += 2) {
          const subject = row[i]?.toString().trim();
          const mark = parseInt(row[i + 1]?.toString() || '');
          
          if (subject && !isNaN(mark)) {
            if (mark < 0 || mark > 100) {
              errors.push(`Invalid marks for ${subject}: ${mark}`);
            } else {
              subjects.push(subject);
              marks.push(mark);
            }
          }
        }

        if (subjects.length === 0) {
          errors.push('No valid subjects/marks found');
        }

        return {
          student_name: studentName,
          roll_number: rollNumber,
          class_name: className,
          department,
          semester,
          academic_year: academicYear,
          subjects,
          marks,
          isValid: errors.length === 0,
          errors
        };
      });

      setPreview(parsedRows);
    } catch (error) {
      toast.error('Failed to parse file. Please check the format.');
      console.error(error);
    }
  };

  const handleImport = async () => {
    const validRows = preview.filter(r => r.isValid);
    
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    setProgress(0);
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const totalMarks = row.marks.reduce((a, b) => a + b, 0);
      const percentage = parseFloat((totalMarks / (row.subjects.length * 100) * 100).toFixed(2));
      const gradeInfo = calculateGrade(percentage);

      const { error } = await supabase.from('student_results').insert({
        user_id: userId,
        student_name: row.student_name,
        roll_number: row.roll_number,
        class_name: row.class_name,
        academic_year: row.academic_year,
        department: row.department || '',
        semester: row.semester,
        institution_type: institutionType,
        subjects: row.subjects,
        marks: row.marks,
        total_marks: totalMarks,
        percentage,
        grade: gradeInfo.grade,
        remarks: gradeInfo.remarks
      });

      if (error) {
        failCount++;
      } else {
        successCount++;
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImporting(false);
    setImportStats({ success: successCount, failed: failCount });
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} results!`);
      onImportComplete();
    }
    if (failCount > 0) {
      toast.error(`Failed to import ${failCount} results`);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setProgress(0);
    setImportStats(null);
    onOpenChange(false);
  };

  const validCount = preview.filter(r => r.isValid).length;
  const invalidCount = preview.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Bulk Import Results
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import multiple student results at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-medium">Download Template</h4>
                  <p className="text-sm text-muted-foreground">
                    Get a pre-formatted Excel template with sample data
                  </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
            />
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">{file ? file.name : 'Click to upload or drag and drop'}</p>
            <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV files</p>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h4 className="font-medium">Preview ({preview.length} rows)</h4>
                <Badge variant="default" className="bg-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Student</th>
                      <th className="p-2 text-left">Roll No</th>
                      <th className="p-2 text-left">Class</th>
                      <th className="p-2 text-left">Subjects</th>
                      <th className="p-2 text-left">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className={`border-t ${row.isValid ? '' : 'bg-destructive/5'}`}>
                        <td className="p-2">
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          )}
                        </td>
                        <td className="p-2 font-medium">{row.student_name || '-'}</td>
                        <td className="p-2">{row.roll_number || '-'}</td>
                        <td className="p-2">{row.class_name || '-'}</td>
                        <td className="p-2">{row.subjects.length}</td>
                        <td className="p-2 text-xs text-destructive">{row.errors.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && (
                  <p className="p-2 text-center text-sm text-muted-foreground bg-muted">
                    ... and {preview.length - 20} more rows
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing results...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Import Stats */}
          {importStats && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <div>
                <p className="font-medium">Import Complete!</p>
                <p className="text-sm text-muted-foreground">
                  {importStats.success} imported successfully, {importStats.failed} failed
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {importStats ? 'Close' : 'Cancel'}
          </Button>
          {!importStats && (
            <Button 
              onClick={handleImport} 
              disabled={validCount === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {validCount} Results
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
