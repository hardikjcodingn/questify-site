import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  GraduationCap, LogOut, Plus, FileText, TrendingUp, 
  Award, BookOpen, School, Building2, Shield,
  Eye, Trash2, Download, BarChart3, FileSpreadsheet, PlusCircle, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceCharts from '@/components/dashboard/PerformanceCharts';
import ResultViewDialog from '@/components/dashboard/ResultViewDialog';
import { exportToPDF, exportAllToCSV } from '@/utils/exportUtils';

interface Subject {
  id: string;
  name: string;
  institution_type: 'school' | 'college';
}

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

const departments = [
  'Science', 'Commerce', 'Arts', 'Engineering', 'Medical', 
  'Computer Science', 'Business Administration'
];

function calculateGrade(percentage: number): { grade: string; remarks: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', remarks: 'Outstanding', color: 'text-emerald-600' };
  if (percentage >= 80) return { grade: 'A', remarks: 'Excellent', color: 'text-green-600' };
  if (percentage >= 70) return { grade: 'B', remarks: 'Good', color: 'text-blue-600' };
  if (percentage >= 60) return { grade: 'C', remarks: 'Average', color: 'text-amber-600' };
  if (percentage >= 40) return { grade: 'D', remarks: 'Below Average', color: 'text-orange-600' };
  return { grade: 'F', remarks: 'Fail', color: 'text-red-600' };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [institutionType, setInstitutionType] = useState<'school' | 'college'>('school');
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState<StudentResult | null>(null);
  const [activeTab, setActiveTab] = useState('results');
  
  // Form state - dynamic subjects
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [className, setClassName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectEntries, setSubjectEntries] = useState<{ subject: string; marks: string }[]>([
    { subject: '', marks: '' },
    { subject: '', marks: '' },
    { subject: '', marks: '' },
    { subject: '', marks: '' },
    { subject: '', marks: '' }
  ]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile?.institution_type) {
      setInstitutionType(profile.institution_type);
    }
  }, [profile]);

  useEffect(() => {
    fetchSubjects();
    fetchResults();
  }, [institutionType, user]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('institution_type', institutionType)
      .eq('is_active', true);
    
    if (error) {
      toast.error('Failed to load subjects');
    } else {
      setSubjects(data || []);
    }
  };

  const fetchResults = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('student_results')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load results');
    } else {
      setResults(data as StudentResult[] || []);
    }
  };

  const addSubjectEntry = () => {
    if (subjectEntries.length >= 10) {
      toast.error('Maximum 10 subjects allowed');
      return;
    }
    setSubjectEntries([...subjectEntries, { subject: '', marks: '' }]);
  };

  const removeSubjectEntry = (index: number) => {
    if (subjectEntries.length <= 1) {
      toast.error('At least one subject is required');
      return;
    }
    setSubjectEntries(subjectEntries.filter((_, i) => i !== index));
  };

  const updateSubjectEntry = (index: number, field: 'subject' | 'marks', value: string) => {
    const updated = [...subjectEntries];
    updated[index][field] = value;
    setSubjectEntries(updated);
  };

  const handleCreateResult = async () => {
    if (!studentName || !rollNumber || !className || !academicYear || !semester) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validEntries = subjectEntries.filter(e => e.subject !== '' && e.marks !== '');
    const validSubjects = validEntries.map(e => e.subject);
    const validMarks = validEntries.map(e => parseInt(e.marks) || 0);

    if (validSubjects.length < 1) {
      toast.error('Please add at least one subject with marks');
      return;
    }

    if (validMarks.some(m => isNaN(m) || m < 0 || m > 100)) {
      toast.error('Please enter valid marks (0-100) for all subjects');
      return;
    }

    const totalMarks = validMarks.reduce((a, b) => a + b, 0);
    const percentage = parseFloat((totalMarks / (validSubjects.length * 100) * 100).toFixed(2));
    const gradeInfo = calculateGrade(percentage);

    setIsCreating(true);
    
    const { error } = await supabase.from('student_results').insert({
      user_id: user?.id,
      student_name: studentName,
      roll_number: rollNumber,
      class_name: className,
      academic_year: academicYear,
      department: department || '',
      semester,
      institution_type: institutionType,
      subjects: validSubjects,
      marks: validMarks,
      total_marks: totalMarks,
      percentage,
      grade: gradeInfo.grade,
      remarks: gradeInfo.remarks
    });

    setIsCreating(false);

    if (error) {
      toast.error('Failed to create result');
    } else {
      toast.success('Result created successfully!');
      setIsDialogOpen(false);
      resetForm();
      fetchResults();
    }
  };

  const resetForm = () => {
    setStudentName('');
    setRollNumber('');
    setClassName('');
    setAcademicYear('');
    setDepartment('');
    setSemester('');
    setSubjectEntries([
      { subject: '', marks: '' },
      { subject: '', marks: '' },
      { subject: '', marks: '' },
      { subject: '', marks: '' },
      { subject: '', marks: '' }
    ]);
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    
    const { error } = await supabase.from('student_results').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete result');
    } else {
      toast.success('Result deleted');
      fetchResults();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleExportAllCSV = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }
    exportAllToCSV(results, 'all_student_results');
    toast.success('CSV exported successfully!');
  };

  const stats = {
    totalResults: results.length,
    averagePercentage: results.length > 0 
      ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
      : 0,
    topGrades: results.filter(r => r.grade === 'A+' || r.grade === 'A').length,
    passRate: results.length > 0
      ? ((results.filter(r => r.percentage >= 40).length / results.length) * 100).toFixed(0)
      : 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">Elite Result Portal</h1>
                <p className="text-sm text-primary-foreground/70">
                  Welcome, {profile?.full_name || 'User'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Institution Type Toggle */}
              <div className="hidden sm:flex items-center gap-2 bg-primary-foreground/20 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setInstitutionType('school')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    institutionType === 'school' 
                      ? 'bg-primary-foreground text-primary' 
                      : 'text-primary-foreground hover:bg-primary-foreground/20'
                  }`}
                >
                  <School className="w-4 h-4" />
                  School
                </button>
                <button
                  onClick={() => setInstitutionType('college')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    institutionType === 'college' 
                      ? 'bg-primary-foreground text-primary' 
                      : 'text-primary-foreground hover:bg-primary-foreground/20'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  College
                </button>
              </div>

              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="gradient-stats border-0 animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Results</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalResults}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-stats border-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average %</p>
                  <p className="text-3xl font-bold text-foreground">{stats.averagePercentage}%</p>
                </div>
                <div className="p-3 bg-info/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-stats border-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Grades</p>
                  <p className="text-3xl font-bold text-foreground">{stats.topGrades}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <Award className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-stats border-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-3xl font-bold text-foreground">{stats.passRate}%</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Results and Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            {/* Create Result Section */}
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Student Results
                  </CardTitle>
                  <CardDescription>
                    Manage and generate student result cards for {institutionType === 'school' ? 'School' : 'College'}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleExportAllCSV}
                    disabled={results.length === 0}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export All CSV
                  </Button>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="hero" size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Generate Result
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-primary" />
                          Generate New Result
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="studentName">Student Name *</Label>
                          <Input
                            id="studentName"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Enter student name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="rollNumber">Roll Number *</Label>
                          <Input
                            id="rollNumber"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            placeholder="Enter roll number"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="className">Class/Grade *</Label>
                          <Input
                            id="className"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="e.g., 10A or B.Tech 2nd Year"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="academicYear">Academic Year *</Label>
                          <Input
                            id="academicYear"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="e.g., 2024-25"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Department (Optional)</Label>
                          <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="semester">Semester/Term *</Label>
                          <Input
                            id="semester"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            placeholder="e.g., Semester 1"
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Subject Marks (out of 100)</h4>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={addSubjectEntry}
                            disabled={subjectEntries.length >= 10}
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Subject
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {subjectEntries.map((entry, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <div className="flex-1">
                                <Select 
                                  value={entry.subject} 
                                  onValueChange={(value) => updateSubjectEntry(index, 'subject', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Subject ${index + 1}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subjects.map(subject => (
                                      <SelectItem key={subject.id} value={subject.name}>
                                        {subject.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                className="w-24"
                                placeholder="Marks"
                                value={entry.marks}
                                onChange={(e) => updateSubjectEntry(index, 'marks', e.target.value)}
                              />
                              {subjectEntries.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-destructive hover:text-destructive"
                                  onClick={() => removeSubjectEntry(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          You can add up to 10 subjects. At least 1 subject is required.
                        </p>
                      </div>
                      
                      <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateResult} disabled={isCreating}>
                          {isCreating ? 'Creating...' : 'Generate Result'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No results yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Click "Generate Result" to create your first student result card.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => {
                          const gradeInfo = calculateGrade(result.percentage);
                          return (
                            <TableRow key={result.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{result.student_name}</TableCell>
                              <TableCell>{result.roll_number}</TableCell>
                              <TableCell>{result.class_name}</TableCell>
                              <TableCell>{result.department || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={result.percentage} 
                                    className="w-16 h-2"
                                  />
                                  <span className="text-sm font-medium">{result.percentage}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={gradeInfo.color} variant="outline">
                                  {result.grade}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(result.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8"
                                    onClick={() => setViewingResult(result)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8"
                                    onClick={() => exportToPDF(result)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteResult(result.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <PerformanceCharts results={results} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Result View Dialog */}
      <ResultViewDialog 
        result={viewingResult} 
        open={!!viewingResult} 
        onOpenChange={(open) => !open && setViewingResult(null)} 
      />
    </div>
  );
}
