// Landing page — clean, professional, light mode
import Link from "next/link";
import { MintKeyLogo } from "@/components/ui/MintKeyLogo";
import { Code2, GitBranch, FileText, TrendingUp, Map, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-default bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <MintKeyLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">Mintkey</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#how" className="hover:text-text-primary transition-colors">How it works</a>
            <a href="#companies" className="hover:text-text-primary transition-colors">Companies</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link href="/login" className="rounded-lg bg-mint-dark px-4 py-2 text-sm font-semibold text-white hover:bg-mint-darker transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[90vh] items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint-light bg-mint-bg px-4 py-1.5 text-sm font-medium text-mint-darker">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Developer Intelligence
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-text-primary sm:text-6xl">
            Know exactly what you
            <br />
            <span className="text-mint-dark">need to get placed</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-text-secondary leading-relaxed">
            Connect your GitHub & LeetCode. Upload your resume. 8 AI agents analyze your profile
            and build a company-specific roadmap to your dream job.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-lg bg-mint-dark px-6 py-3 text-base font-semibold text-white shadow-lg shadow-mint/20 hover:bg-mint-darker transition-all"
            >
              Start Free Analysis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 rounded-lg border border-border-default px-6 py-3 text-base font-medium text-text-secondary hover:bg-bg-hover transition-colors"
            >
              See how it works
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-text-muted">
            {["Free forever", "No credit card", "Works with any stack"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border-default bg-bg-page py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {[
            { value: "15+", label: "Companies Tracked" },
            { value: "200+", label: "Skill Nodes" },
            { value: "8", label: "AI Agents" },
            { value: "100%", label: "Free to Use" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-mint-dark">{s.value}</div>
              <div className="mt-1 text-sm text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold">
              Everything you need to <span className="text-mint-dark">crack interviews</span>
            </h2>
            <p className="mx-auto max-w-lg text-text-secondary">
              8 specialized AI agents analyze every aspect of your profile and build a plan.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Code2, title: "GitHub Intelligence", desc: "Deep analysis of repos, code quality, and engineering maturity" },
              { Icon: TrendingUp, title: "DSA Performance", desc: "LeetCode stats with topic-wise strengths and company readiness" },
              { Icon: FileText, title: "Resume Parser", desc: "AI extracts skills, CGPA, experience — checks eligibility per company" },
              { Icon: TrendingUp, title: "Market Trends", desc: "Real-time skill demand analysis for your target companies" },
              { Icon: Map, title: "Week-by-Week Roadmap", desc: "Personalized plan with daily tasks, DSA targets, and milestones" },
              { Icon: Sparkles, title: "AI Career Coach", desc: "Daily coaching with hidden insights and actionable advice" },
            ].map((f) => (
              <div key={f.title} className="group rounded-xl border border-border-default bg-bg-card p-6 transition-all hover:border-mint/40 hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-mint-bg">
                  <f.Icon className="h-5 w-5 text-mint-dark" strokeWidth={1.8} />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-text-primary">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border-default bg-bg-page py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-14 text-center text-3xl font-bold">
            Three steps to your <span className="text-mint-dark">personalized roadmap</span>
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { step: "01", title: "Connect Profiles", desc: "Link GitHub, LeetCode, and upload your resume. Takes 30 seconds." },
              { step: "02", title: "AI Analyzes Everything", desc: "8 specialized agents run in parallel to assess your complete profile." },
              { step: "03", title: "Get Your Roadmap", desc: "Week-by-week plan with scores, gap analysis, and daily tasks." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-mint-bg text-lg font-bold text-mint-darker">
                  {s.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies */}
      <section id="companies" className="py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-3xl font-bold">
            Tailored for <span className="text-mint-dark">15+ companies</span>
          </h2>
          <p className="mb-10 text-text-secondary">Each company has unique requirements. We know exactly what they look for.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["Google", "Amazon", "Microsoft", "Flipkart", "Razorpay", "Zepto", "CRED", "PhonePe", "Groww", "Swiggy", "Blinkit", "Meesho", "TCS", "Infosys", "Wipro"].map((c) => (
              <span key={c} className="rounded-lg border border-border-default bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary hover:border-mint/40 hover:text-mint-darker transition-colors">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border-default bg-bg-page py-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to know your <span className="text-mint-dark">match score?</span>
          </h2>
          <p className="mb-8 text-text-secondary">Stop guessing. Start preparing with precision.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-mint-dark px-6 py-3 text-base font-semibold text-white shadow-lg shadow-mint/20 hover:bg-mint-darker transition-all"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-default py-8 px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <MintKeyLogo size={20} />
            <span className="text-sm font-medium">Mintkey</span>
          </div>
          <p className="text-xs text-text-muted">© 2026 Mintkey Inc. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-text-muted">
            <a href="#" className="hover:text-text-primary">Privacy</a>
            <a href="#" className="hover:text-text-primary">Terms</a>
            <a href="https://github.com/K007-K/MintKey" target="_blank" className="hover:text-text-primary">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
