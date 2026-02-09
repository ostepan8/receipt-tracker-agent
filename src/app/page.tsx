import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileText,
  Camera,
  Upload,
  PieChart,
  Github,
  ExternalLink,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      {/* Header */}
      <header className="border-b border-[var(--brand-black)]/5 bg-[var(--brand-cream)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/Subconscious_Logo_Graphic.png"
              alt="Subconscious"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="font-bold text-xl text-[var(--brand-black)]">
              Receipt Agent
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              asChild
              className="text-[var(--brand-gray)] hover:text-[var(--brand-black)]"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white"
            >
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-24 text-center relative">
        {/* Semi-transparent logos scattered throughout */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-[0.05] pointer-events-none">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[10%] left-[5%] w-[180px] h-[180px] opacity-[0.07] pointer-events-none rotate-[-15deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[5%] right-[8%] w-[200px] h-[200px] opacity-[0.06] pointer-events-none rotate-[12deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[10%] left-[12%] w-[150px] h-[150px] opacity-[0.07] pointer-events-none rotate-[20deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[15%] right-[10%] w-[140px] h-[140px] opacity-[0.08] pointer-events-none rotate-[-10deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[30%] left-[25%] w-[120px] h-[120px] opacity-[0.04] pointer-events-none rotate-[5deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[25%] right-[22%] w-[130px] h-[130px] opacity-[0.045] pointer-events-none rotate-[-8deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--brand-orange)]/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--brand-teal)]/10 rounded-full blur-3xl -z-10" />

        <div className="inline-flex items-center gap-2 bg-[var(--brand-black)] text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Sparkles className="h-4 w-4 text-[var(--brand-green)]" />
          Powered by AI Agents
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-[var(--brand-black)] mb-6 max-w-4xl mx-auto leading-[1.1] tracking-tight">
          Expense Tracking,{" "}
          <span className="text-[var(--brand-orange)]">Automated</span>
        </h1>
        <p className="text-xl text-[var(--brand-gray)] mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload or photograph receipts. Our AI extracts the data, categorizes
          expenses, and generates reports automatically. No more manual data
          entry.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            size="lg"
            className="h-14 px-8 text-base bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white shadow-lg shadow-[var(--brand-orange)]/25"
            asChild
          >
            <Link href="/sign-up">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 text-base border-[var(--brand-black)]/20 hover:bg-[var(--brand-black)]/5"
            asChild
          >
            <Link href="https://github.com/subconscious-systems/receipt-agent" target="_blank">
              <Github className="mr-2 h-4 w-4" />
              View Source
            </Link>
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-[var(--brand-gray)]">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--brand-green)]" />
            <span>Instant extraction</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--brand-teal)]" />
            <span>Secure &amp; private</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--brand-orange)]" />
            <span>Save hours weekly</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        {/* Semi-transparent logos scattered throughout */}
        <div className="absolute top-[20%] left-[3%] w-[160px] h-[160px] opacity-[0.04] pointer-events-none rotate-[-12deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[15%] right-[5%] w-[180px] h-[180px] opacity-[0.035] pointer-events-none rotate-[15deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[20%] left-[8%] w-[140px] h-[140px] opacity-[0.04] pointer-events-none rotate-[8deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[25%] right-[3%] w-[150px] h-[150px] opacity-[0.045] pointer-events-none rotate-[-18deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[50%] left-[20%] w-[100px] h-[100px] opacity-[0.03] pointer-events-none rotate-[25deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[45%] right-[18%] w-[120px] h-[120px] opacity-[0.035] pointer-events-none rotate-[-5deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--brand-black)] mb-4">
              How It Works
            </h2>
            <p className="text-[var(--brand-gray)] max-w-xl mx-auto">
              Three simple steps to automate your expense tracking
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Upload className="h-7 w-7" />}
              step="01"
              title="Upload Receipt"
              description="Drag and drop an image or PDF, or use your phone camera to capture a receipt instantly."
            />
            <FeatureCard
              icon={<Sparkles className="h-7 w-7" />}
              step="02"
              title="AI Extraction"
              description="Our AI reads the receipt, extracts merchant, date, items, and totals automatically."
            />
            <FeatureCard
              icon={<PieChart className="h-7 w-7" />}
              step="03"
              title="Track & Report"
              description="View spending by category, detect duplicates, and generate expense reports."
            />
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 bg-[var(--brand-cream)] relative">
        {/* Semi-transparent logos scattered throughout */}
        <div className="absolute top-[15%] left-[5%] w-[150px] h-[150px] opacity-[0.05] pointer-events-none rotate-[-10deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[20%] right-[4%] w-[170px] h-[170px] opacity-[0.045] pointer-events-none rotate-[18deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[15%] left-[10%] w-[130px] h-[130px] opacity-[0.05] pointer-events-none rotate-[12deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[20%] right-[6%] w-[160px] h-[160px] opacity-[0.055] pointer-events-none rotate-[-15deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[40%] left-[30%] w-[110px] h-[110px] opacity-[0.04] pointer-events-none rotate-[8deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[50%] right-[25%] w-[100px] h-[100px] opacity-[0.045] pointer-events-none rotate-[-20deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--brand-black)] mb-4">
              Built for Real Receipts
            </h2>
            <p className="text-[var(--brand-gray)] max-w-xl mx-auto">
              Handle any receipt format with confidence
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <CapabilityCard
              icon={<Camera className="h-6 w-6" />}
              title="Mobile Camera"
              description="Snap photos directly from your phone"
              color="orange"
            />
            <CapabilityCard
              icon={<FileText className="h-6 w-6" />}
              title="PDF Support"
              description="Upload PDF receipts and invoices"
              color="teal"
            />
            <CapabilityCard
              icon={<PieChart className="h-6 w-6" />}
              title="Line Items"
              description="Extract individual items from receipts"
              color="green"
            />
            <CapabilityCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Smart Categories"
              description="AI-powered expense categorization"
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-white relative">
        {/* Semi-transparent logos scattered throughout */}
        <div className="absolute top-[10%] left-[8%] w-[140px] h-[140px] opacity-[0.035] pointer-events-none rotate-[-8deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[15%] right-[6%] w-[160px] h-[160px] opacity-[0.04] pointer-events-none rotate-[14deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[10%] left-[5%] w-[130px] h-[130px] opacity-[0.04] pointer-events-none rotate-[20deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[15%] right-[10%] w-[150px] h-[150px] opacity-[0.035] pointer-events-none rotate-[-12deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[45%] left-[15%] w-[100px] h-[100px] opacity-[0.03] pointer-events-none rotate-[5deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[50%] right-[20%] w-[120px] h-[120px] opacity-[0.035] pointer-events-none rotate-[-18deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--brand-black)] mb-4">
              Built With Modern Tech
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto">
              Open source and self-hostable. Clone the repo, add your API keys,
              and deploy to Vercel in under 5 minutes.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <TechBadge name="Next.js 15" />
            <TechBadge name="TypeScript" />
            <TechBadge name="Tailwind CSS" />
            <TechBadge name="Supabase" />
            <TechBadge name="Firebase Auth" />
            <TechBadge name="Subconscious AI" highlight />
            <TechBadge name="Reducto" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[var(--brand-black)] relative overflow-hidden">
        {/* Semi-transparent logos (lighter for dark bg) */}
        <div className="absolute top-[10%] left-[8%] w-[180px] h-[180px] opacity-[0.08] pointer-events-none rotate-[-15deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[15%] right-[5%] w-[200px] h-[200px] opacity-[0.07] pointer-events-none rotate-[12deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[10%] left-[12%] w-[150px] h-[150px] opacity-[0.08] pointer-events-none rotate-[18deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute bottom-[15%] right-[10%] w-[170px] h-[170px] opacity-[0.07] pointer-events-none rotate-[-10deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[40%] left-[25%] w-[130px] h-[130px] opacity-[0.06] pointer-events-none rotate-[8deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-[35%] right-[22%] w-[140px] h-[140px] opacity-[0.065] pointer-events-none rotate-[-20deg]">
          <Image src="/Subconscious_Logo_Graphic.png" alt="" fill className="object-contain" />
        </div>
        {/* Decorative gradient elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-orange)]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--brand-teal)]/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to automate your expenses?
          </h2>
          <p className="text-white/60 mb-10 max-w-xl mx-auto">
            Get started for free. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="h-14 px-8 text-base bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white"
              asChild
            >
              <Link href="/sign-up">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              asChild
            >
              <Link href="https://subconscious.dev/docs" target="_blank">
                Read Docs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--brand-black)]/10 bg-[var(--brand-cream)] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/Subconscious_Logo.png"
                alt="Subconscious"
                width={140}
                height={32}
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm text-[var(--brand-gray)]">
              An open-source{" "}
              <a
                href="https://subconscious.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-orange)] hover:underline font-medium"
              >
                Subconscious
              </a>{" "}
              template
            </p>
            <div className="flex items-center gap-6 text-sm text-[var(--brand-gray)]">
              <a
                href="https://github.com/subconscious-systems/receipt-agent"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--brand-black)] flex items-center gap-1.5"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://subconscious.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--brand-black)] flex items-center gap-1.5"
              >
                <FileText className="h-4 w-4" />
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative bg-[var(--brand-cream)] rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[var(--brand-orange)]/20">
      <div className="absolute top-6 right-6 text-6xl font-bold text-[var(--brand-black)]/5 group-hover:text-[var(--brand-orange)]/10 transition-colors">
        {step}
      </div>
      <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--brand-black)] text-white rounded-xl mb-5 group-hover:bg-[var(--brand-orange)] transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[var(--brand-black)] mb-3">
        {title}
      </h3>
      <p className="text-[var(--brand-gray)] leading-relaxed">{description}</p>
    </div>
  );
}

function CapabilityCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "orange" | "teal" | "green";
}) {
  const colorClasses = {
    orange: "bg-[var(--brand-orange)]/10 text-[var(--brand-orange)]",
    teal: "bg-[var(--brand-teal)]/10 text-[var(--brand-teal)]",
    green: "bg-[var(--brand-green)]/20 text-[var(--brand-black)]",
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--brand-black)]/5 p-6 hover:shadow-lg transition-shadow">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-[var(--brand-black)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--brand-gray)]">{description}</p>
    </div>
  );
}

function TechBadge({ name, highlight }: { name: string; highlight?: boolean }) {
  return (
    <span
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
        highlight
          ? "bg-[var(--brand-orange)] text-white"
          : "bg-[var(--brand-cream)] text-[var(--brand-black)] hover:bg-[var(--brand-black)] hover:text-white"
      }`}
    >
      {name}
    </span>
  );
}
