import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Shield, Users, FileText, Settings, ArrowLeft, 
  Search, Eye, Trash2, UserCog, Database, 
  TrendingUp, Award, BarChart3, Plus, Edit, BookOpen
} from 'lucide-react';
import { Watermark, Logo, FooterBranding } from '@/components/Branding';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  institution_type: 'school' | 'college';
  institution_name: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
}

interface StudentResult {
  id: string;
  user_id: string;
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

interface Subject {
  id: string;
  name: string;
  institution_type: 'school' | 'college';
  is_active: boolean;
}

function calculateGrade(percentage: number): { color: string } {
  if (percentage >= 90) return { color: 'text-emerald-600' };
  if (percentage >= 80) return { color: 'text-green-600' };
  if (percentage >= 70) return { color: 'text-blue-600' };
  if (percentage >= 60) return { color: 'text-amber-600' };
  if (percentage >= 40) return { color: 'text-orange-600' };
  return { color: 'text-red-600' };
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading, user } = useAuth();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [allResults, setAllResults] = useState<StudentResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userResults, setUserResults] = useState<StudentResult[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectType, setNewSubjectType] = useState<'school' | 'college'>('school');

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchProfiles(),
      fetchUserRoles(),
      fetchAllResults(),
      fetchSubjects()
    ]);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles(data || []);
    }
  };

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*');
    
    if (error) {
      console.error('Error fetching user roles:', error);
    } else {
      setUserRoles(data || []);
    }
  };

  const fetchAllResults = async () => {
    const { data, error } = await supabase
      .from('student_results')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching results:', error);
    } else {
      setAllResults(data as StudentResult[] || []);
    }
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching subjects:', error);
    } else {
      setSubjects(data || []);
    }
  };

  const fetchUserResults = async (userId: string) => {
    const { data, error } = await supabase
      .from('student_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user results:', error);
    } else {
      setUserResults(data as StudentResult[] || []);
    }
  };

  const handleViewUser = async (profile: Profile) => {
    setSelectedUser(profile);
    await fetchUserResults(profile.user_id);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will remove all their data.')) return;
    
    // Delete from auth (this will cascade to profiles and results due to foreign keys)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      // If admin API fails, try deleting profile which will cascade
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) {
        toast.error('Failed to delete user');
        return;
      }
    }
    
    toast.success('User deleted successfully');
    fetchAllData();
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    
    const { error } = await supabase
      .from('student_results')
      .delete()
      .eq('id', resultId);
    
    if (error) {
      toast.error('Failed to delete result');
    } else {
      toast.success('Result deleted');
      fetchAllResults();
      if (selectedUser) {
        fetchUserResults(selectedUser.user_id);
      }
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    const { error } = await supabase.from('subjects').insert({
      name: newSubjectName.trim(),
      institution_type: newSubjectType,
      is_active: true
    });

    if (error) {
      toast.error('Failed to add subject');
    } else {
      toast.success('Subject added successfully');
      setNewSubjectName('');
      setIsSubjectDialogOpen(false);
      fetchSubjects();
    }
  };

  const handleToggleSubject = async (subjectId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('subjects')
      .update({ is_active: !isActive })
      .eq('id', subjectId);
    
    if (error) {
      toast.error('Failed to update subject');
    } else {
      fetchSubjects();
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId);
    
    if (error) {
      toast.error('Failed to delete subject');
    } else {
      toast.success('Subject deleted');
      fetchSubjects();
    }
  };

  const getUserRole = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalUsers: profiles.length,
    totalResults: allResults.length,
    schoolResults: allResults.filter(r => r.institution_type === 'school').length,
    collegeResults: allResults.filter(r => r.institution_type === 'college').length,
    averagePercentage: allResults.length > 0
      ? (allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length).toFixed(1)
      : 0,
    topPerformers: allResults.filter(r => r.grade === 'A+' || r.grade === 'A').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Dark Watermark */}
      <Watermark />
      
      {/* Header */}
      <header className="gradient-hero sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Logo className="w-10 h-10 rounded-xl shadow-lg" />
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">Admin Panel</h1>
                <p className="text-sm text-primary-foreground/70">Manage users, results & settings</p>
              </div>
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
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-stats border-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Results</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalResults}</p>
                </div>
                <div className="p-3 bg-info/10 rounded-xl">
                  <FileText className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-stats border-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average %</p>
                  <p className="text-3xl font-bold text-foreground">{stats.averagePercentage}%</p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-stats border-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Performers</p>
                  <p className="text-3xl font-bold text-foreground">{stats.topPerformers}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Award className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Subjects
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Registered Users
                    </CardTitle>
                    <CardDescription>Manage all registered users and their accounts</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Results</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => {
                        const userResultCount = allResults.filter(r => r.user_id === profile.user_id).length;
                        const role = getUserRole(profile.user_id);
                        return (
                          <TableRow key={profile.id}>
                            <TableCell className="font-medium">{profile.full_name}</TableCell>
                            <TableCell>{profile.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {profile.institution_type === 'school' ? 'School' : 'College'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                                {role}
                              </Badge>
                            </TableCell>
                            <TableCell>{userResultCount}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(profile.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8"
                                  onClick={() => handleViewUser(profile)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {profile.user_id !== user?.id && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteUser(profile.user_id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  All Student Results
                </CardTitle>
                <CardDescription>View and manage all generated results across all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allResults.map((result) => {
                        const gradeInfo = calculateGrade(result.percentage);
                        const creator = profiles.find(p => p.user_id === result.user_id);
                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.student_name}</TableCell>
                            <TableCell>{result.roll_number}</TableCell>
                            <TableCell>{result.class_name}</TableCell>
                            <TableCell>{result.department}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {result.institution_type === 'school' ? 'School' : 'College'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={result.percentage} className="w-16 h-2" />
                                <span className="text-sm font-medium">{result.percentage}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={gradeInfo.color} variant="outline">
                                {result.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {creator?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteResult(result.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Subject Management
                  </CardTitle>
                  <CardDescription>Add, edit, or remove subjects for schools and colleges</CardDescription>
                </div>
                <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subject</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Subject Name</Label>
                        <Input
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="Enter subject name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Institution Type</Label>
                        <Select value={newSubjectType} onValueChange={(v) => setNewSubjectType(v as 'school' | 'college')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddSubject}>Add Subject</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* School Subjects */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Badge>School</Badge>
                      Subjects
                    </h4>
                    <div className="space-y-2">
                      {subjects.filter(s => s.institution_type === 'school').map((subject) => (
                        <div 
                          key={subject.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            subject.is_active ? 'bg-card' : 'bg-muted opacity-60'
                          }`}
                        >
                          <span className={subject.is_active ? '' : 'line-through'}>{subject.name}</span>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant={subject.is_active ? 'outline' : 'secondary'}
                              onClick={() => handleToggleSubject(subject.id, subject.is_active)}
                            >
                              {subject.is_active ? 'Disable' : 'Enable'}
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteSubject(subject.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* College Subjects */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Badge variant="secondary">College</Badge>
                      Subjects
                    </h4>
                    <div className="space-y-2">
                      {subjects.filter(s => s.institution_type === 'college').map((subject) => (
                        <div 
                          key={subject.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            subject.is_active ? 'bg-card' : 'bg-muted opacity-60'
                          }`}
                        >
                          <span className={subject.is_active ? '' : 'line-through'}>{subject.name}</span>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant={subject.is_active ? 'outline' : 'secondary'}
                              onClick={() => handleToggleSubject(subject.id, subject.is_active)}
                            >
                              {subject.is_active ? 'Disable' : 'Enable'}
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteSubject(subject.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                User Details: {selectedUser?.full_name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Institution Type</p>
                    <p className="font-medium capitalize">{selectedUser.institution_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant={getUserRole(selectedUser.user_id) === 'admin' ? 'default' : 'secondary'}>
                      {getUserRole(selectedUser.user_id)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* User Results */}
                <div>
                  <h4 className="font-semibold mb-4">Generated Results ({userResults.length})</h4>
                  {userResults.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No results generated by this user</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userResults.map((result) => {
                            const gradeInfo = calculateGrade(result.percentage);
                            return (
                              <TableRow key={result.id}>
                                <TableCell className="font-medium">{result.student_name}</TableCell>
                                <TableCell>{result.roll_number}</TableCell>
                                <TableCell>{result.class_name}</TableCell>
                                <TableCell>{result.percentage}%</TableCell>
                                <TableCell>
                                  <Badge className={gradeInfo.color} variant="outline">
                                    {result.grade}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(result.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      
      {/* Footer Branding */}
      <FooterBranding />
    </div>
  );
}
