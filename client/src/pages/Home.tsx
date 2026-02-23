import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getRegisterUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Code2, Globe, Shield, ShieldBan, ShieldCheck, Zap, Lock, ChevronRight, Star, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";

const features = [
  { icon: Code2, title: "Script Obfuscator", desc: "Multi-layer string encryption, ConstantArray obfuscation, anti-tamper checks and Roblox ENV detection. Up to 3 encryption layers.", badge: "v1.2.5" },
  { icon: Globe, title: "Remote Loader", desc: "Host your scripts securely on S3 and load them remotely with unique access keys. HWID verification built-in.", badge: "Secure" },
  { icon: Activity, title: "Executor Logs", desc: "Full execution tracking with executor name, game ID, HWID, IP address and status. Real-time bypass detection.", badge: "Real-time" },
  { icon: ShieldBan, title: "HWID Ban System", desc: "Ban specific hardware IDs from executing your scripts. Automatic alerts when banned HWIDs attempt access.", badge: "Instant" },
  { icon: ShieldCheck, title: "Dashboard Analytics", desc: "Visual analytics showing most-used scripts, execution trends, error rates and security events.", badge: "Analytics" },
  { icon: Zap, title: "Instant Alerts", desc: "Get notified immediately when bypass attempts, suspicious activity or new HWID bans are detected.", badge: "Alerts" },
];

const techFeatures = ["3-Layer String Encryption","ConstantArray Encryption (2 Layers)","Anti-Tamper Checks","ENV Detection (Roblox)","Variable Renaming","Control Flow Obfuscation","HWID Ban System","S3 Secure Storage","Real-time Logs","Bypass Detection","Email & Password Auth","Free Forever"];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2"><Shield className="w-7 h-7 text-primary" /><span className="text-xl font-bold tracking-tight">Roguard</span></div>
          <div className="flex items-center gap-3">
            {isAuthenticated
              ? <Link href="/dashboard"><Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">Dashboard <ChevronRight className="w-4 h-4" /></Button></Link>
              : <>
                <Link href={getLoginUrl()}><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link href={getRegisterUrl()}><Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign up</Button></Link>
              </>}
          </div>
        </div>
      </nav>
      <section className="relative pt-32 pb-24 bg-grid overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container relative text-center space-y-8">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 px-4 py-1.5 text-sm"><Star className="w-3.5 h-3.5 mr-1.5" />Free Script Protection Platform</Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">Protect Your<br /><span className="text-primary" style={{textShadow:"0 0 20px oklch(0.65 0.22 270 / 0.6)"}}>Roblox Scripts</span></h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Advanced script obfuscation, HWID ban system, remote loader and full execution analytics — completely free.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated
              ? <Link href="/dashboard"><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8"><LayoutDashboard className="w-5 h-5" />Go to Dashboard</Button></Link>
              : <>
                <Link href={getRegisterUrl()}><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8"><Shield className="w-5 h-5" />Get Started — Free</Button></Link>
                <Link href={getLoginUrl()}><Button size="lg" variant="outline" className="gap-2 px-8">Sign In</Button></Link>
              </>}
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-4">{techFeatures.map((f) => <span key={f} className="px-3 py-1 rounded-full text-xs bg-secondary text-muted-foreground border border-border">{f}</span>)}</div>
        </div>
      </section>
      <section id="features" className="py-24 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-16"><h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2><p className="text-muted-foreground text-lg max-w-xl mx-auto">A complete suite of tools to protect, manage and monitor your Roblox scripts.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"><Icon className="w-5 h-5 text-primary" /></div>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">{badge}</Badge>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 border-t border-border/50 bg-card/30">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl font-bold">Start Protecting Your Scripts Today</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Join Roguard and get access to all features for free. No credit card required.</p>
          {isAuthenticated
            ? <Link href="/dashboard"><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-10"><Shield className="w-5 h-5" />Go to Dashboard</Button></Link>
            : <Link href={getRegisterUrl()}><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-10"><Shield className="w-5 h-5" />Sign Up — Free</Button></Link>}
        </div>
      </section>
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Shield className="w-4 h-4 text-primary" /><span className="text-sm">Roguard © 2025 — Free Script Protection Platform</span></div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="w-3 h-3" />All scripts stored securely on S3</div>
        </div>
      </footer>
    </div>
  );
}
