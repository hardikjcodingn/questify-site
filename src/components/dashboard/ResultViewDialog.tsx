import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, FileSpreadsheet, GraduationCap, User, Calendar, Award } from 'lucide-react';
import { exportToPDF, exportSingleToCSV } from '@/utils/exportUtils';

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

interface ResultViewDialogProps {
  result: StudentResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function calculateGrade(percentage: number): { grade: string; remarks: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', remarks: 'Outstanding', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (percentage >= 80) return { grade: 'A', remarks: 'Excellent', color: 'bg-green-100 text-green-800 border-green-300' };
  if (percentage >= 70) return { grade: 'B', remarks: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  if (percentage >= 60) return { grade: 'C', remarks: 'Average', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (percentage >= 40) return { grade: 'D', remarks: 'Below Average', color: 'bg-orange-100 text-orange-800 border-orange-300' };
  return { grade: 'F', remarks: 'Fail', color: 'bg-red-100 text-red-800 border-red-300' };
}

export default function ResultViewDialog({ result, open, onOpenChange }: ResultViewDialogProps) {
  if (!result) return null;

  const gradeInfo = calculateGrade(result.percentage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Student Result Card
          </DialogTitle>
        </DialogHeader>

        {/* Student Info */}
        <div className="gradient-stats rounded-lg p-4 border">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Student Name</p>
                <p className="font-medium">{result.student_name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Roll Number</p>
              <p className="font-medium">{result.roll_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class/Grade</p>
              <p className="font-medium">{result.class_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="font-medium">{result.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Semester/Term</p>
              <p className="font-medium">{result.semester}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Academic Year</p>
                <p className="font-medium">{result.academic_year}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Subject-wise Marks */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Subject-wise Marks
          </h4>
          <div className="space-y-3">
            {result.subjects.map((subject, index) => {
              const mark = result.marks[index];
              const isPassing = mark >= 40;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium truncate" title={subject}>
                    {subject}
                  </div>
                  <div className="flex-1">
                    <Progress 
                      value={mark} 
                      className={`h-3 ${isPassing ? '' : '[&>div]:bg-destructive'}`}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className={`text-sm font-medium ${isPassing ? 'text-success' : 'text-destructive'}`}>
                      {mark}/100
                    </span>
                  </div>
                  <Badge variant={isPassing ? 'default' : 'destructive'} className="w-12 justify-center text-xs">
                    {isPassing ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Result Summary */}
        <div className="gradient-hero rounded-lg p-4 text-primary-foreground">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-primary-foreground/70">Total Marks</p>
              <p className="text-xl font-bold">{result.total_marks}/{result.subjects.length * 100}</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Percentage</p>
              <p className="text-xl font-bold">{result.percentage}%</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Grade</p>
              <Badge className={`text-lg px-4 py-1 ${gradeInfo.color}`}>
                {result.grade}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Result</p>
              <p className="text-xl font-bold">
                {result.percentage >= 40 ? '✓ PASSED' : '✗ FAILED'}
              </p>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-sm text-primary-foreground/80">Remarks: {result.remarks}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportSingleToCSV(result)}
            className="flex-1"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => exportToPDF(result)}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
