import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, GraduationCap, User, Calendar, Award, BarChart3, TrendingUp, Target, Zap, Star, Sparkles, Medal, Trophy, BookOpen } from 'lucide-react';
import { exportToPDF, exportSingleToCSV } from '@/utils/exportUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line
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

const GRADE_COLORS = {
  'A+': 'hsl(142, 76%, 36%)',
  'A': 'hsl(142, 70%, 45%)',
  'B': 'hsl(217, 91%, 60%)',
  'C': 'hsl(48, 96%, 53%)',
  'D': 'hsl(24, 95%, 53%)',
  'F': 'hsl(0, 84%, 60%)'
};

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

  // Radar chart data for subject performance
  const radarData = result.subjects.map((subject, index) => ({
    subject: subject.length > 8 ? subject.substring(0, 6) + '..' : subject,
    marks: result.marks[index],
    fullMarks: 100
  }));

  // Area chart data - cumulative performance
  const cumulativeData = result.subjects.map((subject, index) => {
    const upToThis = result.marks.slice(0, index + 1);
    const cumAvg = Math.round(upToThis.reduce((a, b) => a + b, 0) / upToThis.length);
    return {
      subject: subject.length > 6 ? subject.substring(0, 4) + '..' : subject,
      marks: result.marks[index],
      cumulative: cumAvg,
      target: 60
    };
  });

  // Performance zones
  const performanceZones = [
    { zone: 'Excellent (80+)', count: result.marks.filter(m => m >= 80).length, color: 'hsl(142, 76%, 36%)', icon: Trophy },
    { zone: 'Good (60-79)', count: result.marks.filter(m => m >= 60 && m < 80).length, color: 'hsl(217, 91%, 60%)', icon: Medal },
    { zone: 'Average (40-59)', count: result.marks.filter(m => m >= 40 && m < 60).length, color: 'hsl(48, 96%, 53%)', icon: Star },
    { zone: 'Needs Work (<40)', count: result.marks.filter(m => m < 40).length, color: 'hsl(0, 84%, 60%)', icon: Zap },
  ].filter(z => z.count > 0);

  // Strength and weakness analysis
  const sortedSubjects = result.subjects.map((s, i) => ({ subject: s, marks: result.marks[i] }))
    .sort((a, b) => b.marks - a.marks);
  const strengths = sortedSubjects.slice(0, 2);
  const weaknesses = sortedSubjects.slice(-2).reverse();

  // Radial bar for percentage
  const radialData = [{ name: 'Score', value: result.percentage, fill: 'hsl(var(--primary))' }];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Student Result Card & Analytics
            <Sparkles className="w-4 h-4 text-amber-500" />
          </DialogTitle>
        </DialogHeader>

        {/* Student Info */}
        <div className="gradient-stats rounded-xl p-4 border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative">
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

        {/* Quick Stats - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-0 gradient-stats relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 text-center relative">
              <p className="text-xs text-muted-foreground">Total Marks</p>
              <p className="text-xl font-bold">{result.total_marks}/{result.subjects.length * 100}</p>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 text-center relative">
              <p className="text-xs text-muted-foreground">Percentage</p>
              <p className="text-xl font-bold text-primary">{result.percentage}%</p>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 text-center relative">
              <p className="text-xs text-muted-foreground">Grade</p>
              <Badge className={`text-sm ${gradeInfo.color}`}>{result.grade}</Badge>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 text-center relative">
              <p className="text-xs text-muted-foreground">Passed</p>
              <p className="text-xl font-bold text-success">{passedSubjects}/{result.subjects.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 gradient-stats relative overflow-hidden group hover:shadow-lg transition-shadow">
            <CardContent className="p-3 text-center relative">
              <p className="text-xs text-muted-foreground">Result</p>
              <Badge variant={result.percentage >= 40 ? 'default' : 'destructive'} className="animate-pulse">
                {result.percentage >= 40 ? '✓ PASS' : '✗ FAIL'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Performance Zones */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {performanceZones.map((zone, idx) => (
            <Card key={idx} className="border-0 overflow-hidden" style={{ background: `linear-gradient(135deg, ${zone.color}15, transparent)` }}>
              <CardContent className="p-3 flex items-center gap-2">
                <zone.icon className="w-5 h-5" style={{ color: zone.color }} />
                <div>
                  <p className="text-xs text-muted-foreground">{zone.zone}</p>
                  <p className="font-bold" style={{ color: zone.color }}>{zone.count} subjects</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Subject-wise Marks - Enhanced */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Subject-wise Performance
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
            {result.subjects.map((subject, index) => {
              const mark = result.marks[index];
              const isPassing = mark >= 40;
              const gradeForSubject = mark >= 90 ? 'A+' : mark >= 80 ? 'A' : mark >= 70 ? 'B' : mark >= 60 ? 'C' : mark >= 40 ? 'D' : 'F';
              return (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" 
                       style={{ backgroundColor: GRADE_COLORS[gradeForSubject as keyof typeof GRADE_COLORS] }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={subject}>{subject}</p>
                    <Progress 
                      value={mark} 
                      className={`h-1.5 ${isPassing ? '' : '[&>div]:bg-destructive'}`}
                    />
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`text-sm font-bold ${isPassing ? 'text-success' : 'text-destructive'}`}>
                      {mark}
                    </span>
                    <Badge variant="outline" className="text-xs w-8 justify-center">
                      {gradeForSubject}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Strength & Weakness Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-success">
                <Trophy className="w-4 h-4" />
                Top Performing Subjects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {strengths.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background">
                  <span className="font-medium">{s.subject}</span>
                  <Badge className="bg-success">{s.marks} marks</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-300/30 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                <Zap className="w-4 h-4" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weaknesses.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background">
                  <span className="font-medium">{s.subject}</span>
                  <Badge variant="outline" className="border-amber-300 text-amber-600">{s.marks} marks</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Analytics Charts - Enhanced */}
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
                <div className="h-[200px]">
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

            {/* Radar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Subject Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar 
                        name="Marks" 
                        dataKey="marks" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.4}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Grade Distribution Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gradeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
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

            {/* Performance Trend Area Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Cumulative Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="subject" tick={{ fontSize: 9 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="marks" 
                        stroke="hsl(217, 91%, 60%)" 
                        fill="hsl(217, 91%, 60%)" 
                        fillOpacity={0.3} 
                        name="Subject Marks"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        name="Cumulative Avg"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="hsl(0, 84%, 60%)" 
                        strokeDasharray="5 5"
                        dot={false}
                        name="Pass Line (60%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary Stats */}
          <Card className="gradient-hero text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-4 relative">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/70">Highest</p>
                  <p className="text-2xl font-bold">{highestMark}</p>
                  <p className="text-xs text-primary-foreground/70 truncate">
                    {result.subjects[result.marks.indexOf(highestMark)]}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/70">Lowest</p>
                  <p className="text-2xl font-bold">{lowestMark}</p>
                  <p className="text-xs text-primary-foreground/70 truncate">
                    {result.subjects[result.marks.indexOf(lowestMark)]}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/70">Average</p>
                  <p className="text-2xl font-bold">{averageMark}</p>
                  <p className="text-xs text-primary-foreground/70">per subject</p>
                </div>
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/70">Spread</p>
                  <p className="text-2xl font-bold">{highestMark - lowestMark}</p>
                  <p className="text-xs text-primary-foreground/70">max - min</p>
                </div>
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/70">Remarks</p>
                  <p className="text-lg font-bold">{result.remarks}</p>
                  <p className="text-xs text-primary-foreground/70">grade remark</p>
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
