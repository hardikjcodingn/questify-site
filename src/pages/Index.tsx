import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, ArrowRight, CheckCircle, 
  BarChart3, FileText, Users, Shield, 
  School, Building2, Sparkles, Heart
} from 'lucide-react';
import { Watermark, Logo, MadeByBadge } from '@/components/Branding';

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const features = [
    {
      icon: FileText,
      title: 'Result Generation',
      description: 'Create detailed result cards with grades, percentages, and performance analysis'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track student progress with comprehensive statistics and visualizations'
    },
    {
      icon: School,
      title: 'School & College',
      description: 'Separate configurations for schools and colleges with customizable subjects'
    },
    {
      icon: Shield,
      title: 'Admin Dashboard',
      description: 'Powerful admin panel to manage users, results, and system settings'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden relative">
      {/* Subtle Watermark */}
      <Watermark />

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="container mx-auto px-4 py-6 relative z-20">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12 rounded-xl shadow-lg shadow-indigo-500/20" />
            <div>
              <span className="text-xl font-bold text-white">Elite Result Portal</span>
              <p className="text-xs text-indigo-300">by Hindia Tech Labs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button 
                variant="ghost" 
                className="text-indigo-200 hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-white text-indigo-900 hover:bg-indigo-100 font-semibold shadow-lg shadow-white/20">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-indigo-200 font-medium">Advanced Academic Management</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up drop-shadow-2xl">
            Elite Student
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Result Portal
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
            A comprehensive result management system for schools and colleges. 
            Generate, manage, and analyze student results with ease.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-indigo-100 font-bold text-lg px-8 py-6 shadow-xl shadow-white/20">
                <GraduationCap className="w-5 h-5 mr-2" />
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-2 border-indigo-400/50 text-indigo-100 hover:bg-indigo-500/20 hover:border-indigo-400 font-semibold text-lg px-8 py-6"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Made by Hardik Jain badge */}
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
              <Heart className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-base text-indigo-100">Made with love by <span className="font-bold text-white">Hardik Jain</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-20 relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Powerful Features
          </h2>
          <p className="text-indigo-200 max-w-xl mx-auto">
            Everything you need to manage student results efficiently
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="bg-white/10 backdrop-blur-xl border-white/20 hover:border-indigo-400/50 hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/30 mb-4">
                  <feature.icon className="w-7 h-7 text-indigo-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-indigo-200">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-20 relative z-20">
        <Card className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl border-indigo-400/30 overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="flex justify-center gap-4 mb-6">
              <div className="p-3 bg-white/20 rounded-full">
                <School className="w-6 h-6 text-indigo-200" />
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Building2 className="w-6 h-6 text-indigo-200" />
              </div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Transform Result Management?
            </h2>
            <p className="text-indigo-200 max-w-xl mx-auto mb-8">
              Join educators who trust Elite Result Portal for their academic management needs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-100 font-bold shadow-xl shadow-white/20">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-8 text-sm text-indigo-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Instant setup
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 relative z-20 border-t border-indigo-500/20">
        <div className="flex flex-col items-center gap-6">
          {/* Company Brand */}
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 rounded-xl shadow-lg" />
            <div className="text-center">
              <span className="text-lg font-bold text-white">Hindia Tech Labs</span>
              <p className="text-xs text-indigo-300">Innovative Technology Solutions</p>
            </div>
          </div>

          {/* Made by Hardik Jain */}
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 shadow-lg">
            <Heart className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-sm text-indigo-100">Designed & Developed by <span className="font-bold text-white">Hardik Jain</span></span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-4 border-t border-indigo-500/20">
            <span className="text-sm text-indigo-300">
              © 2024 Elite Result Portal | Hindia Tech Labs. All rights reserved.
            </span>
            <div className="flex items-center gap-6 text-sm text-indigo-300">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}