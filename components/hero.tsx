"use client"

import { Button } from "@/components/ui/button"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Building2, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { CatchableFloatingItem } from "@/components/catchable-item"

// Cardboard Box SVG Component
function CardboardBoxSVG({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 80 70" 
      className={className}
    >
      {/* Box body - orange */}
      <rect x="10" y="20" width="60" height="45" fill="#E07B39" rx="2" />
      {/* Box top flap left */}
      <polygon points="10,20 40,8 40,20" fill="#C66A2D" />
      {/* Box top flap right */}
      <polygon points="70,20 40,8 40,20" fill="#D4722F" />
      {/* Box side shadow */}
      <rect x="55" y="20" width="15" height="45" fill="#C66A2D" rx="0" />
      {/* Box tape/line */}
      <rect x="35" y="20" width="10" height="45" fill="#C9A86C" opacity="0.5" />
      {/* Box highlight */}
      <rect x="12" y="22" width="20" height="3" fill="#F0915A" opacity="0.6" rx="1" />
    </svg>
  )
}

// Passport/ID SVG Component
function PassportSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 90" className={className}>
      {/* Passport cover */}
      <rect x="5" y="5" width="60" height="80" fill="#1E3A5F" rx="4" />
      {/* Passport spine */}
      <rect x="5" y="5" width="8" height="80" fill="#162D4D" rx="2" />
      {/* Gold emblem circle */}
      <circle cx="35" cy="40" r="18" fill="none" stroke="#D4AF37" strokeWidth="2" />
      {/* Inner design */}
      <circle cx="35" cy="40" r="12" fill="none" stroke="#D4AF37" strokeWidth="1" />
      {/* Center star/emblem */}
      <polygon points="35,30 37,36 43,36 38,40 40,46 35,43 30,46 32,40 27,36 33,36" fill="#D4AF37" />
      {/* PASSPORT text area */}
      <rect x="15" y="65" width="40" height="6" fill="#D4AF37" opacity="0.8" rx="1" />
      {/* Top decoration */}
      <rect x="20" y="12" width="30" height="3" fill="#D4AF37" opacity="0.6" rx="1" />
    </svg>
  )
}

// Keys SVG Component
function KeysSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 70" className={className}>
      {/* Key ring */}
      <circle cx="25" cy="25" r="12" fill="none" stroke="#C0A060" strokeWidth="4" />
      {/* Key 1 - gold */}
      <rect x="35" y="22" width="35" height="6" fill="#D4AF37" rx="2" />
      <rect x="60" y="18" width="6" height="6" fill="#D4AF37" />
      <rect x="52" y="18" width="4" height="6" fill="#D4AF37" />
      {/* Key 2 - silver */}
      <rect x="30" y="35" width="30" height="5" fill="#A8A8A8" rx="2" transform="rotate(25 30 35)" />
      <rect x="52" y="28" width="5" height="5" fill="#A8A8A8" transform="rotate(25 52 28)" />
    </svg>
  )
}

// Wallet SVG Component
function WalletSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 60" className={className}>
      {/* Wallet body */}
      <rect x="10" y="15" width="60" height="35" fill="#8B4513" rx="4" />
      {/* Wallet fold line */}
      <line x1="10" y1="32" x2="70" y2="32" stroke="#5D3A1A" strokeWidth="2" />
      {/* Card slot */}
      <rect x="45" y="20" width="20" height="8" fill="#6B3A10" rx="2" />
      {/* Money peeking out */}
      <rect x="15" y="18" width="25" height="10" fill="#228B22" rx="1" />
      {/* Stitching detail */}
      <rect x="12" y="40" width="56" height="2" fill="#5D3A1A" opacity="0.5" />
    </svg>
  )
}

// Phone SVG Component
function PhoneSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 80" className={className}>
      {/* Phone body */}
      <rect x="5" y="5" width="40" height="70" fill="#2C2C2C" rx="6" />
      {/* Screen */}
      <rect x="8" y="12" width="34" height="50" fill="#1a1a1a" rx="2" />
      {/* Screen glow/reflection */}
      <rect x="8" y="12" width="34" height="25" fill="#3a3a3a" opacity="0.3" rx="2" />
      {/* Home button / bottom bar */}
      <rect x="18" y="65" width="14" height="3" fill="#4a4a4a" rx="1" />
      {/* Camera */}
      <circle cx="25" cy="8" r="2" fill="#1a1a1a" />
    </svg>
  )
}

// Watch SVG Component
function WatchSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 80" className={className}>
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
      {/* Watch markers */}
      <circle cx="30" cy="25" r="1.5" fill="#333" />
      <circle cx="45" cy="40" r="1.5" fill="#333" />
      <circle cx="30" cy="55" r="1.5" fill="#333" />
      <circle cx="15" cy="40" r="1.5" fill="#333" />
      {/* Crown */}
      <rect x="50" y="37" width="5" height="6" fill="#C0C0C0" rx="1" />
    </svg>
  )
}

// Floating Wallet - moved to far left for easier catching
function FloatingWallet() {
  return (
    <CatchableFloatingItem
      id="wallet"
      initialPosition={{ left: '-5%', bottom: 'calc(6vh)' }}
      floatAnimation={{ y: [0, -8, 0, -5, 0, -10, 0], rotate: [-1, 2, -1, 3, -2, 1, -1] }}
      floatDuration={4}
    >
      <WalletSVG className="w-28 h-22 md:w-40 md:h-32 lg:w-52 lg:h-40 drop-shadow-2xl" />
    </CatchableFloatingItem>
  )
}

// Floating Passport - left side (closest to hook!)
function FloatingPassport() {
  return (
    <CatchableFloatingItem
      id="passport"
      initialPosition={{ left: '8%', bottom: 'calc(15vh)' }}
      floatAnimation={{ y: [0, -5, 0, -3, 0, -6, 0], rotate: [1, -2, 1, -3, 2, -1, 1] }}
      floatDuration={5}
      floatDelay={0.5}
      collisionRadius={120}
      underwaterOpacity={1}
    >
      <PassportSVG className="w-20 h-26 md:w-28 md:h-36 lg:w-32 lg:h-42 drop-shadow-2xl" />
    </CatchableFloatingItem>
  )
}

// Floating Keys - one instance in center-right (keeping only 1 in hero)
function FloatingKeys() {
  return (
    <CatchableFloatingItem
      id="keys"
      initialPosition={{ right: '25%', bottom: 'calc(14vh)' }}
      floatAnimation={{ y: [0, -5, 0, -3, 0, -6, 0], rotate: [1, -2, 1, -3, 2, -1, 1] }}
      floatDuration={5}
      floatDelay={0.5}
      underwaterOpacity={1}
    >
      <KeysSVG className="w-20 h-16 md:w-28 md:h-24 lg:w-36 lg:h-28 drop-shadow-2xl" />
    </CatchableFloatingItem>
  )
}

// Floating Phone - left-center for easier catching
function FloatingPhone() {
  return (
    <CatchableFloatingItem
      id="phone"
      initialPosition={{ left: '22%', bottom: 'calc(16vh)' }}
      floatAnimation={{ y: [0, -6, 0, -4, 0, -8, 0], rotate: [-2, 1, -2, 3, -1, 2, -2] }}
      floatDuration={4.5}
      floatDelay={1}
      underwaterOpacity={1}
    >
      <PhoneSVG className="w-16 h-24 md:w-20 md:h-32 lg:w-24 lg:h-40 drop-shadow-2xl" />
    </CatchableFloatingItem>
  )
}

// Floating Watch - right side
function FloatingWatch() {
  return (
    <CatchableFloatingItem
      id="watch"
      initialPosition={{ right: '8%', bottom: 'calc(12vh)' }}
      floatAnimation={{ y: [0, -4, 0, -2, 0, -5, 0], rotate: [2, -1, 2, -2, 1, -1, 2] }}
      floatDuration={3.5}
      floatDelay={0.8}
    >
      <WatchSVG className="w-16 h-22 md:w-20 md:h-28 lg:w-24 lg:h-32 drop-shadow-2xl" />
    </CatchableFloatingItem>
  )
}

// Floating Cardboard Box - between center and main
function FloatingBox() {
  return (
    <CatchableFloatingItem
      id="box"
      initialPosition={{ right: '40%', bottom: 'calc(10vh)' }}
      floatAnimation={{ y: [0, -3, 0, -5, 0, -4, 0], rotate: [-1, 3, -1, 2, -2, 1, -1] }}
      floatDuration={5.5}
      floatDelay={1.5}
      underwaterOpacity={1}
    >
      <CardboardBoxSVG className="w-20 h-16 md:w-28 md:h-24 lg:w-36 lg:h-28 drop-shadow-2xl" />
    </CatchableFloatingItem>
  )
}

export default function Hero() {
  const prefersReducedMotion = useReducedMotion()
  const [reducedMotion, setReducedMotion] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setReducedMotion(prefersReducedMotion ?? false)
  }, [prefersReducedMotion])

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    })
  }

  return (
    <>
      {/* Global CSS for wave animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-move-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave-fast {
          animation: wave-move 14s linear infinite;
        }
        .animate-wave-medium {
          animation: wave-move 20s linear infinite;
        }
        .animate-wave-slow {
          animation: wave-move-slow 28s linear infinite;
        }
      `}} />
      
      <section 
        ref={sectionRef}
        className="min-h-screen flex flex-col relative overflow-hidden bg-white"
      >
        {/* Subtle background gradient - white to light gray */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFFFFF] to-[#D4D4D4]/30" />

        {/* Main Content - centered */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-6 md:px-12 lg:px-20 pt-40 pb-[35vh] relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-7xl md:text-9xl lg:text-[11rem] xl:text-[14rem] text-[#2B2B2B] mb-2 tracking-tight leading-[0.85] uppercase text-left md:text-center md:ml-16 lg:ml-12"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Lost
              <br />
              <span className="inline-block md:-ml-28 lg:-ml-32">something?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="text-xl md:text-2xl lg:text-3xl text-[#2B2B2B]/80 mb-4 mt-10 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Found Something?
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
              className="text-xs md:text-sm lg:text-base text-[#2B2B2B]/60 mb-8 max-w-md mx-auto leading-relaxed italic"
            >
              Nepal's trusted platform to reunite people with their belongings.
              We connect finders to seekers.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/browse">
                <Button 
                  size="lg" 
                  className="bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  Start finding
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Animated Water Scene - uniform dark color */}
            <div className="absolute bottom-0 left-0 right-0 h-[45vh] md:h-[50vh] overflow-hidden pointer-events-none z-20">
              {/* Back wave */}
              <div 
                className="absolute bottom-0 h-full animate-wave-slow z-[21]"
                style={{ width: '200%' }}
              >
                <svg
                  className="absolute bottom-0 w-full h-full"
                  viewBox="0 0 2880 320"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="#2B2B2B"
                    fillOpacity="0.7"
                    d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,165.3C840,171,960,213,1080,218.7C1200,224,1320,192,1440,181.3C1560,171,1680,181,1800,186.7L1920,192L1980,170.7C2040,181,2160,203,2280,197.3C2400,192,2520,160,2640,165.3C2760,171,2880,192,2880,192L2880,320L0,320Z"
                  />
                </svg>
              </div>

              {/* Middle wave */}
              <div 
                className="absolute bottom-0 h-full animate-wave-medium z-[22]"
                style={{ width: '200%' }}
              >
                <svg
                  className="absolute bottom-0 w-full h-full"
                  viewBox="0 0 2880 320"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="#2B2B2B"
                    fillOpacity="0.85"
                    d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,218.7C840,235,960,245,1080,234.7C1200,224,1320,192,1440,181.3C1560,171,1680,181,1800,186.7L1920,192L1980,213.3C2040,203,2160,181,2280,181.3C2400,181,2520,203,2640,218.7C2760,235,2880,245,2880,245L2880,320L0,320Z"
                  />
                </svg>
              </div>

              {/* Front wave */}
              <div 
                className="absolute bottom-0 h-full animate-wave-fast z-[23]"
                style={{ width: '200%' }}
              >
                <svg
                  className="absolute bottom-0 w-full h-full"
                  viewBox="0 0 2880 320"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="#2B2B2B"
                    d="M0,256L60,261.3C120,267,240,277,360,272C480,267,600,245,720,234.7C840,224,960,224,1080,234.7C1200,245,1320,267,1440,261.3C1560,256,1680,224,1800,208L1920,192L1980,261.3C2040,267,2160,277,2280,272C2400,267,2520,245,2640,234.7C2760,224,2880,224,2880,224L2880,320L0,320Z"
                  />
                </svg>
              </div>

              {/* Solid water base */}
              <div className="absolute bottom-0 left-0 right-0 h-[12vh] bg-[#2B2B2B] z-[24]" />
            </div>

            {/* Floating Items on water - passport, wallet, phone, watch, box, keys */}
            <FloatingPassport />
            <FloatingPhone />
            <FloatingWallet />
            <FloatingBox />
            <FloatingWatch />
            <FloatingKeys />

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30"
            >
              <motion.button
                onClick={scrollToContent}
                animate={reducedMotion ? {} : { y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Scroll down"
              >
                <ChevronDown className="w-8 h-8" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}

