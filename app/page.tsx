import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import SplitScreenDemo from "@/components/SplitScreenDemo";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#0F766E]/30 font-body">
      
      {/* Header (global-header) */}
      <header id="global-header" className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Shapa Logo" 
                className="h-12 lg:h-16 w-auto" 
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/employer/hub" className="text-[#0F172A] hover:text-[#0F766E] font-medium transition-colors">Find Talent</Link>
              <Link href="/gigs" className="text-[#0F172A] hover:text-[#0F766E] font-medium transition-colors">Browse Gigs</Link>
              <Link href="/feed" className="text-[#0F172A] hover:text-[#0F766E] font-medium transition-colors">How It Works</Link>
              <Link href="/support" className="text-[#0F172A] hover:text-[#0F766E] font-medium transition-colors">Support</Link>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login" className="text-[#0F172A] hover:text-[#0F766E] font-medium transition-colors">Login</Link>
              <Link href="/onboarding" className="inline-flex items-center justify-center px-6 py-3 bg-[#0F766E] hover:bg-[#0D5B54] text-white font-semibold rounded-[12px] transition-all duration-300 shadow-lg shadow-[#0F766E]/20 hover:shadow-xl hover:shadow-[#0F766E]/30 hover:-translate-y-0.5">
                Start Earning Today
              </Link>
            </div>

            {/* Mobile Menu Toggle (Simplified for this version) */}
            <button className="lg:hidden p-2 -mr-2 text-[#0F172A] hover:text-[#0F766E] transition-colors" aria-label="Toggle menu">
              <i className="fa-solid fa-bars text-2xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero-section" className="relative min-h-screen flex items-center bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0F766E]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#0F766E]/5 to-[#10B981]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
          {/* Vodacom Zero-Rated Banner */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F59E0B]"></span>
              </span>
              <span className="text-sm font-medium text-[#0F172A]">Vodacom Zero-Rated</span>
              <span className="text-[#64748B]">•</span>
              <span className="text-sm text-[#64748B]">Free data for WayMakers users</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-12 lg:mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#0F172A] leading-tight mb-6 font-display italic">
              Get Paid for Your{" "}
              <span className="relative inline-block ml-4">
                <span className="text-[#0F766E]">Skills</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 4 150 4 198 10" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round"></path>
                </svg>
              </span>
              <br/>— Not Just Your Resume
            </h1>
            <p className="text-lg sm:text-xl text-[#64748B] max-w-2xl mx-auto mb-12 font-body italic">
              Future WayMakers connects verified skilled workers with employers who need real talent. Record your proof. Show your work. Get hired.
            </p>

            {/* Dual CTA - The Split */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-8">
              {/* The Hustler Card */}
              <div className="group relative w-full sm:w-auto min-w-[300px] p-8 bg-white rounded-3xl border-2 border-[#0F766E] hover:border-[#0F766E] shadow-xl shadow-[#0F766E]/10 hover:shadow-2xl hover:shadow-[#0F766E]/20 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-3 left-4 px-4 py-1.5 bg-[#0F766E] text-white text-[10px] font-black uppercase tracking-wider rounded-full italic">For Talent</div>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 bg-[#F0FDFA] rounded-2xl flex items-center justify-center group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                    <i className="fa-solid fa-video text-2xl text-[#0F766E] group-hover:text-white"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[#0F172A] text-xl font-display italic uppercase leading-none">I&apos;m The Hustler</h3>
                    <p className="text-xs text-[#64748B] italic">Show your skills, get hired</p>
                  </div>
                </div>
                <div className="scale-90"><GoogleSignInButton next="/onboarding?role=hustler" /></div>
              </div>

              {/* The Boss Card */}
              <div className="group relative w-full sm:w-auto min-w-[300px] p-8 bg-white rounded-3xl border-2 border-[#E2E8F0] hover:border-[#8B5CF6] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-3 left-4 px-4 py-1.5 bg-[#8B5CF6] text-white text-[10px] font-black uppercase tracking-wider rounded-full italic">For Employers</div>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 bg-[#F0FDFA] rounded-2xl flex items-center justify-center group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors">
                    <i className="fa-solid fa-users text-2xl text-[#8B5CF6] group-hover:text-white"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[#0F172A] text-xl font-display italic uppercase leading-none">I&apos;m The Boss</h3>
                    <p className="text-xs text-[#64748B] italic">Find verified talent fast</p>
                  </div>
                </div>
                <div className="scale-90"><GoogleSignInButton next="/employer/hub" /></div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-10 mt-16 text-xs text-[#64748B] font-bold uppercase tracking-widest italic">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-check text-[#10B981]"></i>
                <span>Verified Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-video text-[#0F766E]"></i>
                <span>Video Proofs</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-lock text-[#8B5CF6]"></i>
                <span>Secure Escrow</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-[#E2E8F0]">
              <img 
                src="https://assets.ls-assets.com/provider/istock/2185128107.jpg?w=1200" 
                alt="Skilled workers" 
                className="w-full h-auto" 
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Floating Stats Card */}
              <div className="absolute bottom-10 left-10 right-10">
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                  <StatCard icon="fa-check" label="Jobs Completed" value="10,000+" color="bg-[#10B981]/20 text-[#10B981]" />
                  <StatCard icon="fa-star" label="Verified Talent" value="5,000+" color="bg-[#0F766E]/20 text-[#0F766E]" />
                  <StatCard icon="fa-ranking-star" label="Integrity Score" value="98.5%" color="bg-[#F59E0B]/20 text-[#F59E0B]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <a href="#how-it-works" className="flex flex-col items-center gap-2 text-[#64748B] hover:text-[#0F766E] transition-colors">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">Scroll to explore</span>
            <i className="fa-solid fa-chevron-down"></i>
          </a>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block px-5 py-2 bg-[#F0FDFA] text-[#0F766E] text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-6 italic">Simple Process</span>
            <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase font-display leading-[0.9]">
              How Future <br/>WayMakers Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard number="1" icon="fa-user-check" title="Create Your Profile" desc="Sign up and record a video proof of your skills. Your VibeCV showcases real work, not just resumes." />
            <StepCard number="2" icon="fa-bullseye" title="Find or Post Gigs" desc="Browse available jobs in your area or post a gig. Our smart matching connects you with the right opportunities." />
            <StepCard number="3" icon="fa-hand-holding-dollar" title="Get Paid Securely" desc="Funds are held in escrow until work is complete. Release payment only when satisfied. No disputes." />
          </div>

          <div className="text-center mt-16 scale-125">
            <GoogleSignInButton next="/onboarding" />
          </div>
        </div>
      </section>

      <SplitScreenDemo />

      {/* Proof Preview Section */}
      <section id="proof-preview" className="relative py-32 bg-[#1E293B] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0F766E]/20 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-[128px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block px-5 py-2 bg-white/10 text-[#0F766E] text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-6 italic">See the Proof</span>
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase font-display leading-none text-white">Real Skills. <br/><span className="text-[#0F766E]">Real Proof.</span></h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <ProofCard img="https://assets.ls-assets.com/provider/istock/2196695325.jpg?w=480" title="Auto Mechanic" author="Thabo M." location="Soweto" rating="4.9" />
            <ProofCard img="https://assets.ls-assets.com/provider/istock/2226631022.jpg?w=480" title="Master Carpenter" author="Sipho K." location="Johannesburg" rating="5.0" />
            <ProofCard img="https://assets.ls-assets.com/provider/istock/2159561945.jpg?w=480" title="Electrician" author="David N." location="Pretoria" rating="4.8" />
          </div>

          <div className="text-center mt-20">
            <Link href="/feed" className="inline-flex items-center gap-4 px-12 py-6 bg-white text-[#0F172A] hover:bg-[#F0FDFA] font-black uppercase text-xs tracking-widest rounded-full transition-all duration-300 shadow-xl hover:-translate-y-1 italic">
              <i className="fa-solid fa-play"></i> Watch More Proofs
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="final-cta" className="relative py-32 bg-gradient-to-br from-[#0F766E] to-[#0D5B54] overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.3"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')` }}></div>

        <div className="relative max-w-4xl mx-auto px-8 text-center text-white">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-glow border border-white/5">
            <i className="fa-solid fa-rocket text-5xl"></i>
          </div>
          <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase font-display mb-8">Ready to <br/>Start Earning?</h2>
          <p className="font-bold text-xl mb-16 opacity-80 italic">Join 50,000+ skilled workers and employers already using Future WayMakers.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 mb-16 scale-110">
             <GoogleSignInButton next="/onboarding?role=hustler" />
             <GoogleSignInButton next="/employer/hub" />
          </div>

          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] italic">
            <i className="fa-solid fa-shield-check mr-2"></i> Free to join • No hidden fees • Vodacom zero-rated
          </p>
        </div>
      </section>

      {/* Footer (global-footer) */}
      <footer id="global-footer" className="bg-[#1E293B] text-white">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-16">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <Link href="/">
                <img 
                  src="/logo.png" 
                  alt="Shapa Logo" 
                  className="h-16 w-auto" 
                />
              </Link>
              <p className="text-white/50 font-bold leading-relaxed italic max-w-sm">Connecting verified skilled workers with employers who need real talent. Your CV, but make it TikTok.</p>
              <a href="https://chat.whatsapp.com/mock" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-4 px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all italic">
                <i className="fa-brands fa-whatsapp text-xl"></i> Join WhatsApp Community
              </a>
            </div>

            <div>
              <h4 className="font-black italic uppercase tracking-widest text-xs mb-8 text-[#0F766E]">For Talent</h4>
              <ul className="space-y-4 text-sm font-bold opacity-60 italic">
                <li><Link href="/onboarding?role=hustler" className="hover:text-[#0F766E] transition-colors">Create Profile</Link></li>
                <li><Link href="/gigs" className="hover:text-[#0F766E] transition-colors">Browse Gigs</Link></li>
                <li><Link href="/talent/wallet" className="hover:text-[#0F766E] transition-colors">Wallet</Link></li>
                <li><Link href="/talent/studio/record" className="hover:text-[#0F766E] transition-colors">Record Proof</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black italic uppercase tracking-widest text-xs mb-8 text-[#8B5CF6]">For Employers</h4>
              <ul className="space-y-4 text-sm font-bold opacity-60 italic">
                <li><Link href="/onboarding?role=boss" className="hover:text-[#8B5CF6] transition-colors">Post a Gig</Link></li>
                <li><Link href="/employer/hub" className="hover:text-[#8B5CF6] transition-colors">Find Talent</Link></li>
                <li><Link href="/contracts" className="hover:text-[#8B5CF6] transition-colors">My Contracts</Link></li>
                <li><Link href="/hub" className="hover:text-[#8B5CF6] transition-colors">Operations Hub</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black italic uppercase tracking-widest text-xs mb-8 text-[#64748B]">Company</h4>
              <ul className="space-y-4 text-sm font-bold opacity-60 italic">
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 py-10 px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 font-black uppercase text-[9px] tracking-[0.6em] italic text-white/30">
            <p>© 2026 Future WayMakers Platform Group SA. POPIA Compliant.</p>
            <div className="flex gap-8">
               <a href="#" className="hover:text-white"><i className="fa-brands fa-facebook-f text-lg"></i></a>
               <a href="#" className="hover:text-white"><i className="fa-brands fa-x-twitter text-lg"></i></a>
               <a href="#" className="hover:text-white"><i className="fa-brands fa-instagram text-lg"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-5 px-6 py-4 bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border border-white/10 group hover:scale-105 transition-all">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
        <i className={`fa-solid ${icon} text-xl`}></i>
      </div>
      <div>
        <p className="text-[9px] text-[#64748B] font-black uppercase tracking-widest italic">{label}</p>
        <p className="font-black text-[#0F172A] text-xl font-display">{value}</p>
      </div>
    </div>
  );
}

function StepCard({ number, icon, title, desc }: { number: string; icon: string; title: string; desc: string }) {
  return (
    <div className="relative group p-10 bg-white border border-[#E2E8F0] rounded-[3rem] hover:border-[#0F766E]/30 transition-all hover:scale-105 duration-500 hover:shadow-2xl hover:shadow-[#0F766E]/5">
      <div className="w-14 h-14 bg-[#0F766E] text-white rounded-2xl flex items-center justify-center text-xl font-black italic font-display mb-10 shadow-lg shadow-[#0F766E]/20">{number}</div>
      <div className="w-16 h-16 bg-[#F0FDFA] rounded-[1.5rem] flex items-center justify-center mb-6 text-[#0F766E]">
        <i className={`fa-solid ${icon} text-3xl`}></i>
      </div>
      <h3 className="text-2xl font-black italic tracking-tighter uppercase font-display mb-4">{title}</h3>
      <p className="text-gray-500 font-bold text-sm leading-relaxed italic opacity-70">{desc}</p>
    </div>
  );
}

function ValuePropCard({ icon, color, bg, title, desc }: { icon: string; color: string; bg: string; title: string; desc: string }) {
  return (
    <div className="p-10 bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-[#0F766E]/20 transition-all duration-500 group">
      <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-premium`}>
        <i className={`fa-solid ${icon} text-3xl`}></i>
      </div>
      <h3 className="text-2xl font-black italic tracking-tighter uppercase font-display mb-4">{title}</h3>
      <p className="text-gray-500 font-bold text-sm leading-relaxed italic opacity-70">{desc}</p>
    </div>
  );
}

function ProofCard({ img, title, author, location, rating }: { img: string; title: string; author: string; location: string; rating: string }) {
  return (
    <div className="group relative rounded-[3rem] overflow-hidden bg-[#334155] border-4 border-white/5 hover:border-[#0F766E] transition-all duration-500 cursor-pointer shadow-premium hover:shadow-[0_0_50px_rgba(15,118,110,0.3)]">
      <div className="aspect-[9/16] relative">
        <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" crossOrigin="anonymous" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-[#0F766E] transition-all transform group-hover:scale-125 border border-white/20">
            <i className="fa-solid fa-play text-white text-2xl ml-1"></i>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="px-4 py-1.5 bg-[#10B981] text-white text-[9px] font-black uppercase tracking-widest rounded-full italic">Verified</div>
            <div className="flex items-center gap-2 text-white/90 text-[10px] font-black italic">
              <i className="fa-solid fa-star text-[#F59E0B]"></i>
              <span>{rating}</span>
            </div>
          </div>
          <h4 className="text-white font-black text-3xl italic tracking-tighter uppercase font-display leading-none mb-2">{title}</h4>
          <p className="text-white/50 text-[10px] uppercase font-black tracking-widest italic">{author} • {location}</p>
        </div>
      </div>
    </div>
  );
}
