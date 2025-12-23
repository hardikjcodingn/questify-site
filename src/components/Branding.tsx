import { Heart } from 'lucide-react';
import logo from '@/assets/logo.png';

export function Watermark() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[1] overflow-hidden">
      <h1 
        className="font-black text-black/20 dark:text-white/15 whitespace-nowrap transform -rotate-12 select-none tracking-tight leading-none"
        style={{
          fontSize: 'clamp(80px, 18vw, 280px)',
        }}
      >
        Hindia Tech Labs
      </h1>
    </div>
  );
}

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img src={logo} alt="Elite Result Portal" className={`${className} object-contain`} />
  );
}

export function MadeByBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-white/10 border border-primary/20 dark:border-white/20 ${className}`}>
      <Heart className="w-4 h-4 text-red-500 animate-pulse" />
      <span className="text-sm text-muted-foreground dark:text-white/80">
        Made with ❤️ by <span className="font-bold text-foreground dark:text-white">Hardik Jain</span>
      </span>
    </div>
  );
}

export function FooterBranding() {
  return (
    <footer className="w-full py-6 px-4 border-t border-border bg-background/80 backdrop-blur-sm relative z-10">
      <div className="container mx-auto flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 rounded-lg" />
          <div className="text-center">
            <span className="text-lg font-bold text-foreground">Hindia Tech Labs</span>
            <p className="text-xs text-muted-foreground">Innovative Technology Solutions</p>
          </div>
        </div>
        
        <MadeByBadge />
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            © 2024 Elite Result Portal | Hindia Tech Labs. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
