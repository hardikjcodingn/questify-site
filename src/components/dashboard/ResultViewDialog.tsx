import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, GraduationCap, User, Calendar, Award, BarChart3, TrendingUp, Target } from 'lucide-react';
import { exportToPDF, exportSingleToCSV } from '@/utils/exportUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';

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

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(48, 96%, 53%)', 'hsl(24, 95%, 53%)', 'hsl(0, 84%, 60%)', 'hsl(280, 70%, 50%)', 'hsl(190, 80%, 45%)', 'hsl(320, 70%, 50%)'];

export default function ResultViewDialog({ result, open, onOpenChange }: ResultViewDialogProps) {
  if (!result) return null;

  const gradeInfo = calculateGrade(result.percentage);

  // Subject performance data for bar chart
  const subjectData = result.subjects.map((subject, index) => ({
    subject: subject.length > 10 ? subject.substring(0, 8) + '...' : subject,
    fullName: subject,
    marks: result.marks[index],
    maxMarks: 100,
    fill: result.marks[index] >= 80 ? 'hsl(142, 76%, 36%)' : 
          result.marks[index] >= 60 ? 'hsl(217, 91%, 60%)' : 
          result.marks[index] >= 40 ? 'hsl(48, 96%, 53%)' : 'hsl(0, 84%, 60%)'
  }));

  // Grade distribution for this result
  const gradeDistribution = [
    { name: 'A+ (90-100)', value: result.marks.filter(m => m >= 90).length, fill: 'hsl(142, 76%, 36%)' },
    { name: 'A (80-89)', value: result.marks.filter(m => m >= 80 && m < 90).length, fill: 'hsl(142, 70%, 45%)' },
    { name: 'B (70-79)', value: result.marks.filter(m => m >= 70 && m < 80).length, fill: 'hsl(217, 91%, 60%)' },
    { name: 'C (60-69)', value: result.marks.filter(m => m >= 60 && m < 70).length, fill: 'hsl(48, 96%, 53%)' },
    { name: 'D (40-59)', value: result.marks.filter(m => m >= 40 && m < 60).length, fill: 'hsl(24, 95%, 53%)' },
    { name: 'F (<40)', value: result.marks.filter(m => m < 40).length, fill: 'hsl(0, 84%, 60%)' }
  ].filter(g => g.value > 0);

  // Performance metrics
  const passedSubjects = result.marks.filter(m => m >= 40).length;
  const failedSubjects = result.marks.filter(m => m < 40).length;
  const highestMark = Math.max(...result.marks);
  const lowestMark = Math.min(...result.marks);
  const averageMark = Math.round(result.marks.reduce((a, b) => a + b, 0) / result.marks.length);

  // Radial chart data for percentage
  const radialData = [
    { name: 'Percentage', value: result.percentage, fill: 'hsl(var(--primary))' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Student Result Card & Analytics
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-0 gradient-stats">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Marks</p>
              <p className="text-lg font-bold">{result.total_marks}/{result.subjects.length * 100}</p>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Percentage</p>
              <p className="text-lg font-bold text-primary">{result.percentage}%</p>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Grade</p>
              <Badge className={`text-sm ${gradeInfo.color}`}>{result.grade}</Badge>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Passed</p>
              <p className="text-lg font-bold text-success">{passedSubjects}/{result.subjects.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Result</p>
              <Badge variant={result.percentage >= 40 ? 'default' : 'destructive'}>
                {result.percentage >= 40 ? 'PASS' : 'FAIL'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Subject-wise Marks */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Subject-wise Marks
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {result.subjects.map((subject, index) => {
              const mark = result.marks[index];
              const isPassing = mark >= 40;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-28 text-sm font-medium truncate" title={subject}>
                    {subject}
                  </div>
                  <div className="flex-1">
                    <Progress 
                      value={mark} 
                      className={`h-2.5 ${isPassing ? '' : '[&>div]:bg-destructive'}`}
                    />
                  </div>
                  <div className="w-16 text-right">
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

        {/* Analytics Charts */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Performance Analytics
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Performance Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis 
                        dataKey="subject" 
                        type="category" 
                        width={70}
                        tick={{ fontSize: 9 }}
                      />
                      <Tooltip 
                        formatter={(value, name, props) => [`${value} marks`, props.payload.fullName]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="marks" radius={[0, 4, 4, 0]}>
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Grade Distribution Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gradeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ name, value }) => `${value}`}
                        labelLine={false}
                      >
                        {gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} subjects`, name]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary Stats */}
          <Card className="gradient-hero text-primary-foreground">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-primary-foreground/70">Highest</p>
                  <p className="text-xl font-bold">{highestMark}</p>
                  <p className="text-xs text-primary-foreground/70">
                    {result.subjects[result.marks.indexOf(highestMark)]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/70">Lowest</p>
                  <p className="text-xl font-bold">{lowestMark}</p>
                  <p className="text-xs text-primary-foreground/70">
                    {result.subjects[result.marks.indexOf(lowestMark)]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/70">Average</p>
                  <p className="text-xl font-bold">{averageMark}</p>
                  <p className="text-xs text-primary-foreground/70">per subject</p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/70">Remarks</p>
                  <p className="text-lg font-bold">{result.remarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
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
            Download PDF (with Analytics)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
