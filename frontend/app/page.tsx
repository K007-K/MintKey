import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-bg-base/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-indigo to-accent-violet">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight">MintKey</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-text-muted md:flex">
            <a href="#features" className="transition-colors hover:text-text-primary">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-text-primary">How it works</a>
            <a href="#companies" className="transition-colors hover:text-text-primary">Companies</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-border/50 px-4 py-2 text-sm font-medium text-text-muted transition-all hover:border-accent-indigo hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-accent-indigo to-accent-violet px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-accent-indigo/25"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent-indigo/10 blur-[120px]" />
          <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-accent-violet/8 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-teal/5 blur-[120px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent-indigo/30 bg-accent-indigo/10 px-4 py-1.5 text-sm text-accent-indigo">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-score-high" />
            AI-Powered Career Intelligence
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Know exactly what
            <br />
            <span className="bg-gradient-to-r from-accent-indigo via-accent-violet to-teal bg-clip-text text-transparent">
              you need to get placed
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-muted sm:text-xl">
            Connect your GitHub & LeetCode. Upload your resume. Our 8 AI agents analyze your profile
            and build a <span className="text-text-primary font-medium">company-specific roadmap</span> to your dream job.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-violet px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-accent-indigo/25 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent-indigo/30"
            >
              Start Free Analysis
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-bg-surface/50 px-8 py-4 text-lg font-medium text-text-muted transition-all hover:border-border hover:text-text-primary"
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-text-muted/70">
            Free forever • No credit card • Works with any tech stack
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/20 bg-bg-surface/30 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { value: "15+", label: "Companies Tracked" },
            { value: "200+", label: "Skill Nodes" },
            { value: "8", label: "AI Agents" },
            { value: "100%", label: "Free to Use" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-accent-indigo to-accent-violet bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-accent-indigo to-accent-violet bg-clip-text text-transparent">
                crack your dream company
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-text-muted">
              8 specialized AI agents analyze every aspect of your profile and build a personalized action plan.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🔍",
                title: "GitHub Intelligence",
                desc: "Deep analysis of your repos, code quality, and engineering maturity",
                gradient: "from-indigo-500/10 to-violet-500/10",
              },
              {
                icon: "📊",
                title: "DSA Performance",
                desc: "LeetCode analysis with topic-wise strengths and company readiness scores",
                gradient: "from-teal-500/10 to-cyan-500/10",
              },
              {
                icon: "📄",
                title: "Resume Parser",
                desc: "AI extracts skills, CGPA, experience — checks eligibility for each company",
                gradient: "from-amber-500/10 to-orange-500/10",
              },
              {
                icon: "📈",
                title: "Market Trends",
                desc: "Real-time skill demand analysis for your target companies",
                gradient: "from-rose-500/10 to-pink-500/10",
              },
              {
                icon: "🗺️",
                title: "Week-by-Week Roadmap",
                desc: "Personalized prep plan with daily tasks, DSA targets, and milestones",
                gradient: "from-emerald-500/10 to-green-500/10",
              },
              {
                icon: "🤖",
                title: "AI Career Coach",
                desc: "Get motivated with daily tasks, hidden insights, and actionable advice",
                gradient: "from-purple-500/10 to-fuchsia-500/10",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`group rounded-2xl border border-border/30 bg-gradient-to-br ${feature.gradient} p-6 transition-all hover:border-accent-indigo/40 hover:shadow-lg hover:shadow-accent-indigo/5 hover:-translate-y-1`}
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-y border-border/20 bg-bg-surface/20 py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Three steps to your{" "}
              <span className="bg-gradient-to-r from-accent-indigo to-teal bg-clip-text text-transparent">
                personalized roadmap
              </span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Connect Your Profiles",
                desc: "Link your GitHub, LeetCode, and upload your resume. Takes 30 seconds.",
                icon: "🔗",
              },
              {
                step: "02",
                title: "AI Analyzes Everything",
                desc: "8 specialized agents run in parallel to assess your complete profile.",
                icon: "⚡",
              },
              {
                step: "03",
                title: "Get Your Roadmap",
                desc: "Receive a week-by-week plan with match scores, gap analysis, and daily tasks.",
                icon: "🎯",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-indigo/10 text-2xl">
                  {item.icon}
                </div>
                <div className="mb-2 text-xs font-semibold tracking-widest text-accent-indigo uppercase">
                  Step {item.step}
                </div>
                <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section id="companies" className="py-24 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Tailored for{" "}
            <span className="bg-gradient-to-r from-accent-indigo to-accent-violet bg-clip-text text-transparent">
              15+ companies
            </span>
          </h2>
          <p className="mb-12 text-text-muted">
            Each company has unique requirements. We know exactly what they look for.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              "Google", "Amazon", "Microsoft", "Flipkart", "Razorpay",
              "Zepto", "CRED", "PhonePe", "Groww", "Swiggy",
              "Blinkit", "Meesho", "TCS", "Infosys", "Wipro",
            ].map((company) => (
              <div
                key={company}
                className="rounded-xl border border-border/30 bg-bg-surface/50 px-5 py-3 text-sm font-medium text-text-muted transition-all hover:border-accent-indigo/40 hover:text-text-primary hover:bg-accent-indigo/5"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/20 py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to know your{" "}
            <span className="bg-gradient-to-r from-accent-indigo to-teal bg-clip-text text-transparent">
              match score?
            </span>
          </h2>
          <p className="mb-8 text-lg text-text-muted">
            Stop guessing. Start preparing with precision.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-violet px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-accent-indigo/25 transition-all hover:scale-[1.02] hover:shadow-2xl"
          >
            Get Started — It&apos;s Free
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-bg-surface/20 py-12 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent-indigo to-accent-violet">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <span className="text-sm font-semibold">MintKey</span>
          </div>
          <p className="text-xs text-text-muted">
            © 2026 MintKey. Built with ❤️ for students who want more.
          </p>
          <div className="flex gap-6 text-xs text-text-muted">
            <a href="https://github.com/K007-K/MintKey" target="_blank" className="hover:text-text-primary transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
