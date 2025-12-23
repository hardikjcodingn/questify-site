import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { GitCompare, ArrowUp, ArrowDown, Minus, Trophy, TrendingUp, Target, Award } from 'lucide-react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell
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

interface CompareResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: StudentResult[];
}

export default function CompareResultsDialog({ open, onOpenChange, results }: CompareResultsDialogProps) {
  const [student1Id, setStudent1Id] = useState<string>('');
  const [student2Id, setStudent2Id] = useState<string>('');

  const student1 = results.find(r => r.id === student1Id);
  const student2 = results.find(r => r.id === student2Id);

  useEffect(() => {
    if (open && results.length >= 2) {
      setStudent1Id(results[0].id);
      setStudent2Id(results[1].id);
    }
  }, [open, results]);

  const getCompareColor = (val1: number, val2: number, forStudent1: boolean) => {
    if (val1 === val2) return 'text-muted-foreground';
    const isHigher = forStudent1 ? val1 > val2 : val2 > val1;
    return isHigher ? 'text-success' : 'text-destructive';
  };

  const getCompareIcon = (val1: number, val2: number, forStudent1: boolean) => {
    if (val1 === val2) return <Minus className="w-4 h-4" />;
    const isHigher = forStudent1 ? val1 > val2 : val2 > val1;
    return isHigher ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Prepare comparison data for charts
  const getSubjectComparisonData = () => {
    if (!student1 || !student2) return [];
    
    const allSubjects = [...new Set([...student1.subjects, ...student2.subjects])];
    return allSubjects.map(subject => {
      const idx1 = student1.subjects.indexOf(subject);
      const idx2 = student2.subjects.indexOf(subject);
      return {
        subject: subject.length > 12 ? subject.substring(0, 10) + '...' : subject,
        fullName: subject,
        [student1.student_name]: idx1 >= 0 ? student1.marks[idx1] : 0,
        [student2.student_name]: idx2 >= 0 ? student2.marks[idx2] : 0,
      };
    });
  };

  const getRadarData = () => {
    if (!student1 || !student2) return [];
    
    const metrics = [
      { metric: 'Percentage', s1: student1.percentage, s2: student2.percentage },
      { metric: 'Highest Mark', s1: Math.max(...student1.marks), s2: Math.max(...student2.marks) },
      { metric: 'Lowest Mark', s1: Math.min(...student1.marks), s2: Math.min(...student2.marks) },
      { metric: 'Average', s1: Math.round(student1.marks.reduce((a, b) => a + b, 0) / student1.marks.length), s2: Math.round(student2.marks.reduce((a, b) => a + b, 0) / student2.marks.length) },
      { metric: 'Pass Rate', s1: (student1.marks.filter(m => m >= 40).length / student1.marks.length) * 100, s2: (student2.marks.filter(m => m >= 40).length / student2.marks.length) * 100 },
    ];
    return metrics;
  };

  const winner = student1 && student2 
    ? student1.percentage > student2.percentage ? student1 
    : student2.percentage > student1.percentage ? student2 
    : null 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Compare Student Results
          </DialogTitle>
        </DialogHeader>

        {/* Student Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Student 1</label>
            <Select value={student1Id} onValueChange={setStudent1Id}>
              <SelectTrigger className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {results.filter(r => r.id !== student2Id).map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.student_name} ({r.roll_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Student 2</label>
            <Select value={student2Id} onValueChange={setStudent2Id}>
              <SelectTrigger className="bg-orange-50 dark:bg-orange-950/30 border-orange-200">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {results.filter(r => r.id !== student1Id).map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.student_name} ({r.roll_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {student1 && student2 && (
          <>
            {/* Winner Banner */}
            {winner && (
              <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-bold text-lg">{winner.student_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Leading with {winner.percentage}% ({(winner.percentage - (winner === student1 ? student2.percentage : student1.percentage)).toFixed(1)}% higher)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Comparison Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Student 1 Card */}
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {student1.student_name}
                    {winner === student1 && <Trophy className="w-5 h-5 text-amber-500" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{student1.roll_number} | {student1.class_name}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-2xl font-bold text-blue-600">{student1.percentage}%</p>
                      <p className="text-xs text-muted-foreground">Percentage</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <Badge className="text-lg">{student1.grade}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Grade</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total: {student1.total_marks}/{student1.subjects.length * 100}</span>
                    <span>Subjects: {student1.subjects.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Student 2 Card */}
              <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {student2.student_name}
                    {winner === student2 && <Trophy className="w-5 h-5 text-amber-500" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{student2.roll_number} | {student2.class_name}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-2xl font-bold text-orange-600">{student2.percentage}%</p>
                      <p className="text-xs text-muted-foreground">Percentage</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <Badge className="text-lg">{student2.grade}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Grade</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total: {student2.total_marks}/{student2.subjects.length * 100}</span>
                    <span>Subjects: {student2.subjects.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Detailed Comparison Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject-wise Comparison Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Subject-wise Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getSubjectComparisonData()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="subject" type="category" width={80} tick={{ fontSize: 9 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey={student1.student_name} fill="hsl(217, 91%, 60%)" radius={[0, 2, 2, 0]} />
                        <Bar dataKey={student2.student_name} fill="hsl(24, 95%, 53%)" radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Performance Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Performance Radar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={getRadarData()}>
                        <PolarGrid className="stroke-muted" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar name={student1.student_name} dataKey="s1" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.3} />
                        <Radar name={student2.student_name} dataKey="s2" stroke="hsl(24, 95%, 53%)" fill="hsl(24, 95%, 53%)" fillOpacity={0.3} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject-by-Subject Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Subject-by-Subject Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {[...new Set([...student1.subjects, ...student2.subjects])].map((subject, idx) => {
                    const idx1 = student1.subjects.indexOf(subject);
                    const idx2 = student2.subjects.indexOf(subject);
                    const mark1 = idx1 >= 0 ? student1.marks[idx1] : null;
                    const mark2 = idx2 >= 0 ? student2.marks[idx2] : null;

                    return (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                        <div className="col-span-1 flex items-center gap-1">
                          {mark1 !== null && mark2 !== null && (
                            <span className={getCompareColor(mark1, mark2, true)}>
                              {getCompareIcon(mark1, mark2, true)}
                            </span>
                          )}
                          <span className="text-sm font-medium text-blue-600">
                            {mark1 !== null ? mark1 : '-'}
                          </span>
                        </div>
                        
                        <div className="col-span-1">
                          <Progress 
                            value={mark1 || 0} 
                            className="h-2 [&>div]:bg-blue-500"
                          />
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <span className="text-xs font-medium truncate block" title={subject}>
                            {subject.length > 15 ? subject.substring(0, 12) + '...' : subject}
                          </span>
                        </div>
                        
                        <div className="col-span-1">
                          <Progress 
                            value={mark2 || 0} 
                            className="h-2 [&>div]:bg-orange-500"
                          />
                        </div>
                        
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <span className="text-sm font-medium text-orange-600">
                            {mark2 !== null ? mark2 : '-'}
                          </span>
                          {mark1 !== null && mark2 !== null && (
                            <span className={getCompareColor(mark2, mark1, false)}>
                              {getCompareIcon(mark2, mark1, false)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">{student1.student_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">{student2.student_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="gradient-hero text-primary-foreground">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-primary-foreground/70">Percentage Diff</p>
                    <p className="text-xl font-bold">
                      {Math.abs(student1.percentage - student2.percentage).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">Common Subjects</p>
                    <p className="text-xl font-bold">
                      {student1.subjects.filter(s => student2.subjects.includes(s)).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">S1 Avg Mark</p>
                    <p className="text-xl font-bold">
                      {Math.round(student1.marks.reduce((a, b) => a + b, 0) / student1.marks.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">S2 Avg Mark</p>
                    <p className="text-xl font-bold">
                      {Math.round(student2.marks.reduce((a, b) => a + b, 0) / student2.marks.length)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {results.length < 2 && (
          <div className="text-center py-8 text-muted-foreground">
            <GitCompare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You need at least 2 results to compare</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
