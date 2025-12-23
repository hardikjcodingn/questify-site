import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Award } from 'lucide-react';

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

interface PerformanceChartsProps {
  results: StudentResult[];
}

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(48, 96%, 53%)', 'hsl(24, 95%, 53%)', 'hsl(0, 84%, 60%)'];
const GRADE_COLORS: Record<string, string> = {
  'A+': 'hsl(142, 76%, 36%)',
  'A': 'hsl(142, 70%, 45%)',
  'B': 'hsl(217, 91%, 60%)',
  'C': 'hsl(48, 96%, 53%)',
  'D': 'hsl(24, 95%, 53%)',
  'F': 'hsl(0, 84%, 60%)'
};

export default function PerformanceCharts({ results }: PerformanceChartsProps) {
  if (results.length === 0) {
    return (
      <Card className="animate-slide-up">
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No data for charts</h3>
          <p className="text-sm text-muted-foreground">
            Generate some results to see performance analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Grade Distribution Data
  const gradeDistribution = results.reduce((acc, result) => {
    acc[result.grade] = (acc[result.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    grade,
    count,
    percentage: ((count / results.length) * 100).toFixed(1)
  })).sort((a, b) => {
    const order = ['A+', 'A', 'B', 'C', 'D', 'F'];
    return order.indexOf(a.grade) - order.indexOf(b.grade);
  });

  // Marks Distribution (0-40, 40-60, 60-80, 80-100)
  const marksRanges = [
    { range: '0-40', label: 'Below 40%', count: 0 },
    { range: '40-60', label: '40-60%', count: 0 },
    { range: '60-80', label: '60-80%', count: 0 },
    { range: '80-100', label: '80-100%', count: 0 }
  ];

  results.forEach(result => {
    if (result.percentage < 40) marksRanges[0].count++;
    else if (result.percentage < 60) marksRanges[1].count++;
    else if (result.percentage < 80) marksRanges[2].count++;
    else marksRanges[3].count++;
  });

  // Subject-wise average marks (from all results)
  const subjectAverages: Record<string, { total: number; count: number }> = {};
  results.forEach(result => {
    result.subjects.forEach((subject, index) => {
      if (!subjectAverages[subject]) {
        subjectAverages[subject] = { total: 0, count: 0 };
      }
      subjectAverages[subject].total += result.marks[index];
      subjectAverages[subject].count++;
    });
  });

  const subjectData = Object.entries(subjectAverages)
    .map(([subject, data]) => ({
      subject: subject.length > 12 ? subject.substring(0, 12) + '...' : subject,
      fullName: subject,
      average: Math.round(data.total / data.count)
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8);

  // Performance trend (by creation date)
  const sortedByDate = [...results].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const trendData = sortedByDate.slice(-10).map((result, index) => ({
    name: `#${index + 1}`,
    percentage: result.percentage,
    student: result.student_name
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Pie Chart */}
        <Card className="animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="w-4 h-4 text-primary" />
              Grade Distribution
            </CardTitle>
            <CardDescription>Overview of grades across all results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeData}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                    labelLine={true}
                  >
                    {gradeData.map((entry) => (
                      <Cell 
                        key={entry.grade} 
                        fill={GRADE_COLORS[entry.grade] || COLORS[0]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} students`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Marks Range Distribution Bar Chart */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-primary" />
              Marks Distribution
            </CardTitle>
            <CardDescription>Students by percentage ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marksRanges}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} students`, 'Count']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject-wise Average */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-primary" />
              Subject-wise Average
            </CardTitle>
            <CardDescription>Average marks per subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    dataKey="subject" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} marks`, 
                      props.payload.fullName
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="average" 
                    fill="hsl(var(--accent))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recent Performance Trend
            </CardTitle>
            <CardDescription>Last 10 results performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}%`, 
                      props.payload.student
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
