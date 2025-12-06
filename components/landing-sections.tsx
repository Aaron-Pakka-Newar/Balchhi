"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CatchableFloatingItem } from "@/components/catchable-item"
import {
  Search,
  Shield,
  Handshake,
  Building2,
  MapPin,
  Bell,
  CheckCircle2,
  Truck,
  Users,
  FileCheck,
  CreditCard,
  ArrowRight,
  Phone,
  Mail,
  Clock,
} from "lucide-react"
import Link from "next/link"

// Floating Box SVG component for underwater effect
function FloatingBoxSVG({ className = "", style = {}, id = "underwater-box" }: { className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <CatchableFloatingItem
      id={id}
      className={className}
      style={style}
      floatAnimation={{ y: [0, -15, 0], rotate: [-2, 2, -2] }}
      floatDuration={4 + Math.random() * 2}
    >
      <svg viewBox="0 0 100 80" className="w-full h-full">
        {/* Box body */}
        <rect x="10" y="20" width="80" height="55" fill="#8B7355" stroke="#5D4E37" strokeWidth="2"/>
        {/* Box flaps */}
        <polygon points="10,20 50,5 90,20 50,35" fill="#A0896C" stroke="#5D4E37" strokeWidth="2"/>
        {/* Center line on flaps */}
        <line x1="50" y1="5" x2="50" y2="35" stroke="#5D4E37" strokeWidth="2"/>
        {/* Side shading */}
        <rect x="10" y="20" width="15" height="55" fill="#7A6548" opacity="0.5"/>
        {/* Tape */}
        <rect x="42" y="20" width="16" height="55" fill="#C4A574" opacity="0.7"/>
      </svg>
    </CatchableFloatingItem>
  )
}

// Floating Keys SVG
function FloatingKeysSVG({ className = "", style = {}, id = "underwater-keys" }: { className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <CatchableFloatingItem
      id={id}
      className={className}
      style={style}
      floatAnimation={{ y: [0, -12, 0], rotate: [-5, 5, -5] }}
      floatDuration={5}
    >
      <svg viewBox="0 0 80 70" className="w-full h-full">
        {/* Key ring */}
        <circle cx="25" cy="25" r="12" fill="none" stroke="#C0A060" strokeWidth="4" />
        {/* Key 1 - gold */}
        <rect x="35" y="22" width="35" height="6" fill="#D4AF37" rx="2" />
        <rect x="60" y="18" width="6" height="6" fill="#D4AF37" />
        <rect x="52" y="18" width="4" height="6" fill="#D4AF37" />
        {/* Key 2 - silver */}
        <rect x="30" y="35" width="30" height="5" fill="#A8A8A8" rx="2" transform="rotate(25 30 35)" />
      </svg>
    </CatchableFloatingItem>
  )
}

// Floating Wallet SVG
function FloatingWalletSVG({ className = "", style = {}, id = "underwater-wallet" }: { className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <CatchableFloatingItem
      id={id}
      className={className}
      style={style}
      floatAnimation={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
      floatDuration={4.5}
    >
      <svg viewBox="0 0 80 60" className="w-full h-full">
        {/* Wallet body */}
        <rect x="10" y="15" width="60" height="35" fill="#8B4513" rx="4" />
        {/* Wallet fold line */}
        <line x1="10" y1="32" x2="70" y2="32" stroke="#5D3A1A" strokeWidth="2" />
        {/* Card slot */}
        <rect x="45" y="20" width="20" height="8" fill="#6B3A10" rx="2" />
        {/* Money peeking out */}
        <rect x="15" y="18" width="25" height="10" fill="#228B22" rx="1" />
      </svg>
    </CatchableFloatingItem>
  )
}

// Floating Phone SVG
function FloatingPhoneSVG({ className = "", style = {}, id = "underwater-phone" }: { className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <CatchableFloatingItem
      id={id}
      className={className}
      style={style}
      floatAnimation={{ y: [0, -8, 0], rotate: [-2, 4, -2] }}
      floatDuration={5.5}
    >
      <svg viewBox="0 0 50 80" className="w-full h-full">
        {/* Phone body */}
        <rect x="5" y="5" width="40" height="70" fill="#2C2C2C" rx="6" />
        {/* Screen */}
        <rect x="8" y="12" width="34" height="50" fill="#1a1a1a" rx="2" />
        {/* Screen glow */}
        <rect x="8" y="12" width="34" height="25" fill="#3a3a3a" opacity="0.3" rx="2" />
        {/* Home button */}
        <rect x="18" y="65" width="14" height="3" fill="#4a4a4a" rx="1" />
      </svg>
    </CatchableFloatingItem>
  )
}

// Floating Watch SVG
function FloatingWatchSVG({ className = "", style = {}, id = "underwater-watch" }: { className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <CatchableFloatingItem
      id={id}
      className={className}
      style={style}
      floatAnimation={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
      floatDuration={4}
    >
      <svg viewBox="0 0 60 80" className="w-full h-full">
        {/* Watch strap top */}
        <rect x="18" y="5" width="24" height="20" fill="#4A3728" rx="3" />
        {/* Watch strap bottom */}
        <rect x="18" y="55" width="24" height="20" fill="#4A3728" rx="3" />
        {/* Watch face */}
        <circle cx="30" cy="40" r="20" fill="#C0C0C0" />
        <circle cx="30" cy="40" r="17" fill="#F5F5F5" />
        {/* Watch hands */}
        <line x1="30" y1="40" x2="30" y2="28" stroke="#333" strokeWidth="2" />
        <line x1="30" y1="40" x2="40" y2="40" stroke="#333" strokeWidth="2" />
      </svg>
    </CatchableFloatingItem>
  )
}

// Floating Glasses SVG
function FloatingGlassesSVG({ className = "", style = {}, id = "underwater-glasses" }: { className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <CatchableFloatingItem
      id={id}
      className={className}
      style={style}
      floatAnimation={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
      floatDuration={5}
    >
      <svg viewBox="0 0 100 50" className="w-full h-full">
        {/* Left lens */}
        <ellipse cx="25" cy="25" rx="18" ry="15" fill="none" stroke="#333" strokeWidth="3" />
        {/* Right lens */}
        <ellipse cx="75" cy="25" rx="18" ry="15" fill="none" stroke="#333" strokeWidth="3" />
        {/* Bridge */}
        <path d="M43,25 Q50,18 57,25" fill="none" stroke="#333" strokeWidth="3" />
        {/* Left arm */}
        <line x1="7" y1="20" x2="3" y2="15" stroke="#333" strokeWidth="3" />
        {/* Right arm */}
        <line x1="93" y1="20" x2="97" y2="15" stroke="#333" strokeWidth="3" />
        {/* Lens tint */}
        <ellipse cx="25" cy="25" rx="15" ry="12" fill="#87CEEB" opacity="0.3" />
        <ellipse cx="75" cy="25" rx="15" ry="12" fill="#87CEEB" opacity="0.3" />
      </svg>
    </CatchableFloatingItem>
  )
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

// Animated section wrapper
function AnimatedSection({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// How It Works Section
export function HowItWorksSection() {
  const steps = [
    {
      icon: Search,
      title: "Post or Search",
      description: "Report your lost item or browse found items in your area across Nepal.",
    },
    {
      icon: Bell,
      title: "Get Matched",
      description: "Our smart system matches lost items with found reports and notifies you instantly.",
    },
    {
      icon: Shield,
      title: "Verify Identity",
      description: "Secure verification process ensures items go to their rightful owners.",
    },
    {
      icon: Handshake,
      title: "Safe Handover",
      description: "Meet safely at verified locations or arrange secure delivery across Nepal.",
    },
  ]

  return (
    <section className="py-24 px-6 md:px-8 bg-[#2B2B2B] relative overflow-hidden">
      {/* Floating items for underwater effect */}
      <FloatingWalletSVG id="hiw-wallet-left" className="w-20 h-16" style={{ top: '10%', left: '-2%' }} />
      <FloatingWalletSVG id="hiw-wallet" className="w-24 h-18" style={{ top: '60%', right: '8%' }} />
      <FloatingGlassesSVG id="hiw-glasses" className="w-36 h-20" style={{ bottom: '15%', left: '15%' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl text-white mb-4"
            style={{ fontFamily: "'Calmingly', cursive" }}
          >
            How It Works
          </h2>
          <p className="text-lg text-[#B3B3B3] max-w-2xl mx-auto">
            Reunite with your belongings in four simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title}>
              <Card className="bg-[#1a1a1a] border-[#3a3a3a] h-full hover:border-[#4a4a4a] transition-all duration-300">
                <CardContent className="pt-8 pb-6 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#3a3a3a] flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-medium text-[#D4D4D4] mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#B3B3B3] text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Trusted Verification Section
export function TrustedVerificationSection() {
  const features = [
    {
      icon: FileCheck,
      title: "ID Verification",
      description: "Verify your identity using citizenship, passport, or driving license.",
    },
    {
      icon: CreditCard,
      title: "Payment Verification",
      description: "Small verification fee via eSewa, Khalti, or IME Pay ensures genuine users.",
    },
    {
      icon: CheckCircle2,
      title: "Verified Badge",
      description: "Verified users get priority in search results and build trust.",
    },
  ]

  return (
    <section className="py-24 px-6 md:px-8 bg-[#2B2B2B] relative overflow-hidden">
      {/* Floating items */}
      <FloatingPhoneSVG id="verify-phone" className="w-20 h-32" style={{ top: '5%', right: '10%' }} />
      <FloatingWatchSVG id="verify-watch" className="w-24 h-32" style={{ bottom: '20%', left: '3%' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl text-white mb-4"
            style={{ fontFamily: "'Calmingly', cursive" }}
          >
            Trusted Verification
          </h2>
          <p className="text-lg text-[#B3B3B3] max-w-2xl mx-auto">
            We ensure every transaction is safe and items reach their rightful owners
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-[#3a3a3a] flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-[#B3B3B3] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Delivery Section
export function DeliverySection() {
  const options = [
    {
      icon: MapPin,
      title: "Safe Meet-up Points",
      description: "Meet at verified public locations like police stations, malls, or busy public areas.",
    },
    {
      icon: Truck,
      title: "Secure Delivery",
      description: "Arrange delivery through trusted couriers across Nepal with tracking.",
    },
    {
      icon: CheckCircle2,
      title: "Handover Confirmation",
      description: "Both parties confirm successful handover with OTP verification.",
    },
  ]

  return (
    <section className="py-24 px-6 md:px-8 bg-[#2B2B2B] relative overflow-hidden">
      {/* Floating items */}
      <FloatingPhoneSVG id="delivery-phone" className="w-20 h-32" style={{ top: '15%', left: '8%' }} />
      <FloatingWalletSVG id="delivery-wallet" className="w-28 h-22" style={{ bottom: '10%', right: '15%' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl text-white mb-4"
            style={{ fontFamily: "'Calmingly', cursive" }}
          >
            Safe Handover <span style={{ fontFamily: "system-ui, sans-serif" }}>&</span> Delivery
          </h2>
          <p className="text-lg text-[#B3B3B3] max-w-2xl mx-auto">
            Multiple options to ensure your items are returned safely
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {options.map((option, index) => (
            <div key={option.title}>
              <Card className="bg-[#1a1a1a] border-[#3a3a3a] h-full hover:border-[#4a4a4a] transition-colors duration-300">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="w-14 h-14 rounded-xl bg-[#3a3a3a] flex items-center justify-center mb-6">
                    <option.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {option.title}
                  </h3>
                  <p className="text-[#B3B3B3] leading-relaxed">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// For Organizations Section
export function ForOrganizationsSection() {
  const orgTypes = [
    "Police Stations",
    "Hotels & Resorts",
    "Airports",
    "Bus Parks",
    "Universities",
    "Shopping Malls",
    "Hospitals",
    "Banks",
  ]

  return (
    <section className="py-24 px-6 md:px-8 bg-[#2B2B2B] relative overflow-hidden">
      {/* Floating items */}
      <FloatingGlassesSVG id="org-glasses" className="w-36 h-20" style={{ top: '8%', left: '3%' }} />
      <FloatingPhoneSVG id="org-phone" className="w-18 h-28" style={{ bottom: '25%', right: '5%' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-8 h-8 text-[#D4D4D4]" />
              <span className="text-[#D4D4D4] font-medium">For Organizations</span>
            </div>
            <h2 
              className="text-3xl md:text-4xl text-white mb-6"
              style={{ fontFamily: "'Calmingly', cursive" }}
            >
              Manage lost and found for your organization
            </h2>
            <p className="text-lg text-[#B3B3B3] mb-8 leading-relaxed">
              Join Nepal's largest network of trusted organizations. Help reunite 
              people with their belongings while maintaining your reputation for 
              excellent service.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-[#D4D4D4] flex-shrink-0" />
                <span>Bulk upload found items with one click</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-[#D4D4D4] flex-shrink-0" />
                <span>Track storage locations and retention dates</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-[#D4D4D4] flex-shrink-0" />
                <span>Analytics dashboard for your team</span>
              </li>
              <li className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-[#D4D4D4] flex-shrink-0" />
                <span>Verified organization badge</span>
              </li>
            </ul>

            <Link href="/dashboard/organization">
              <Button 
                size="lg"
                className="bg-white text-[#2B2B2B] hover:bg-[#D4D4D4] text-lg px-8 py-6 rounded-xl group"
              >
                Add to your organisation
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {orgTypes.map((org, index) => (
              <div
                key={org}
                className="bg-[#3a3a3a]/50 backdrop-blur-sm rounded-xl p-4 text-center"
              >
                <span className="text-white font-medium">{org}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Stats Section
export function StatsSection() {
  const stats = [
    { number: "10,000+", label: "Items Reunited" },
    { number: "500+", label: "Organizations" },
    { number: "75", label: "Districts Covered" },
    { number: "24/7", label: "Support Available" },
  ]

  return (
    <section className="py-20 px-6 md:px-8 bg-[#2B2B2B] relative overflow-hidden">
      {/* Floating items */}
      <FloatingWatchSVG className="w-22 h-28" style={{ top: '20%', right: '10%' }} />
      <FloatingWalletSVG className="w-26 h-20" style={{ bottom: '30%', left: '5%' }} />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-[#B3B3B3] font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

// CTA Section
export function CTASection() {
  return (
    <section className="py-24 px-6 md:px-8 bg-[#2B2B2B] relative overflow-hidden">
      {/* Floating items */}
      <FloatingKeysSVG className="w-32 h-26" style={{ top: '10%', left: '5%' }} />
      <FloatingWatchSVG className="w-24 h-32" style={{ bottom: '15%', right: '8%' }} />
      <FloatingGlassesSVG className="w-30 h-18" style={{ top: '50%', right: '25%' }} />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to find what you lost?
        </h2>
        <p className="text-xl text-[#B3B3B3] mb-10 max-w-2xl mx-auto">
          Join thousands of Nepalis who have reunited with their belongings through Balchhi.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/browse">
            <Button 
              size="lg"
              className="bg-white hover:bg-[#D4D4D4] text-[#2B2B2B] text-lg px-10 py-6 rounded-xl shadow-lg"
            >
              Start finding now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/listing/create">
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#2B2B2B] text-lg px-10 py-6 rounded-xl"
            >
              Report an item
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

// Contact Section
export function ContactSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "0px" })

  return (
    <section className="py-24 px-6 md:px-8 bg-[#2B2B2B] relative overflow-hidden">
      {/* Floating items */}
      <FloatingWatchSVG className="w-14 h-18" style={{ top: '15%', right: '5%' }} />
      <FloatingBoxSVG className="w-16 h-14" style={{ bottom: '20%', left: '8%' }} />
      
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl text-white mb-4"
            style={{ fontFamily: "'Calmingly', cursive" }}
          >
            Need Help?
          </h2>
          <p className="text-lg text-[#B3B3B3] max-w-2xl mx-auto">
            Our team is here to assist you in finding your lost items
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#3a3a3a] flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Call Us</h3>
            <p className="text-[#B3B3B3]">+977 1-4XXXXXX</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#3a3a3a] flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Email Us</h3>
            <p className="text-[#B3B3B3]">help@balchhi.com</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#3a3a3a] flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hours</h3>
            <p className="text-[#B3B3B3]">24/7 Support Available</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

