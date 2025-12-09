"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, X, User, MessageCircle, Bell } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { TransitionLink } from "@/components/page-transition"
import NotificationsDropdown from "@/components/notifications-dropdown"

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isInDarkSection, setIsInDarkSection] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Check if we're on the home page
  const isHomePage = pathname === "/"

  useEffect(() => {
    if (!isHomePage) {
      setIsInDarkSection(false)
      setIsScrolled(false)
      return
    }

    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight
      
      // Check if scrolled past hero section (into dark sections)
      setIsInDarkSection(scrollY > heroHeight - 100)
      setIsScrolled(scrollY > 50)
    }

    handleScroll() // Check initial state
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Dynamic colors based on section
  const textColor = isInDarkSection ? 'text-white' : 'text-[#2B2B2B]'
  const textColorMuted = isInDarkSection ? 'text-white/70 hover:text-white' : 'text-[#2B2B2B]/70 hover:text-[#2B2B2B]'
  const hoverBg = isInDarkSection ? 'hover:bg-white/10' : 'hover:bg-[#D4D4D4]'
  const buttonBg = isInDarkSection ? 'bg-white text-[#2B2B2B] hover:bg-white/90' : 'bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white'
  const borderColor = isInDarkSection ? 'border-white/20' : 'border-[#D4D4D4]'

  // Header background: white on hero (home page), dark water color in dark sections, white on other pages
  const headerBg = !isHomePage 
    ? 'bg-white' 
    : isInDarkSection 
      ? 'bg-[#2B2B2B]' 
      : 'bg-white'

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-200 ${headerBg}`}>
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <TransitionLink href="/" className="flex items-center">
            <span 
              className={`text-3xl tracking-tight font-bold transition-colors duration-200 ${textColor}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Balchhi
            </span>
          </TransitionLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <TransitionLink 
              href="/browse" 
              className={`transition-colors font-medium ${textColorMuted}`}
            >
              Browse
            </TransitionLink>
            <TransitionLink 
              href="/listing/create" 
              className={`transition-colors font-medium ${textColorMuted}`}
            >
              Report Item
            </TransitionLink>
            {user?.role === 'organization' && (
              <TransitionLink 
                href="/dashboard/organization" 
                className={`transition-colors font-medium ${textColorMuted}`}
              >
                Organizations
              </TransitionLink>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <TransitionLink href="/messages">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${textColor} ${hoverBg} transition-colors duration-200`}
                    title="Messages"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </TransitionLink>
                <NotificationsDropdown textColor={textColor} hoverBg={hoverBg} />
                <TransitionLink href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`${textColor} ${hoverBg} gap-2 transition-colors duration-200`}
                  >
                    <User className="w-4 h-4" />
                    {user.name}
                  </Button>
                </TransitionLink>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  className={`${textColor} ${hoverBg} transition-colors duration-200`}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <TransitionLink href="/login">
                <Button 
                  className={`font-semibold px-6 transition-colors duration-200 ${buttonBg}`}
                >
                  Sign In
                </Button>
              </TransitionLink>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`md:hidden ${textColor} ${hoverBg} transition-colors duration-200`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-4 border-t ${borderColor} ${isInDarkSection ? 'bg-[#2B2B2B]/95' : 'bg-white/95'} backdrop-blur-sm -mx-6 px-6`}>
            <nav className="flex flex-col gap-2">
              <TransitionLink 
                href="/browse" 
                className={`${textColor} ${hoverBg} px-4 py-3 rounded-lg transition-colors block`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </TransitionLink>
              <TransitionLink 
                href="/listing/create" 
                className={`${textColor} ${hoverBg} px-4 py-3 rounded-lg transition-colors block`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Report Item
              </TransitionLink>
              {user?.role === 'organization' && (
                <TransitionLink 
                  href="/dashboard/organization" 
                  className={`${textColor} ${hoverBg} px-4 py-3 rounded-lg transition-colors block`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Organizations
                </TransitionLink>
              )}
              
              <div className={`pt-4 border-t ${borderColor} mt-2`}>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <TransitionLink 
                      href="/messages"
                      className={`${textColor} ${hoverBg} px-4 py-3 rounded-lg transition-colors flex items-center gap-2`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Messages
                    </TransitionLink>
                    <TransitionLink 
                      href="/dashboard"
                      className={`${textColor} ${hoverBg} px-4 py-3 rounded-lg transition-colors flex items-center gap-2`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </TransitionLink>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className={`${textColor} ${hoverBg} px-4 py-3 rounded-lg transition-colors flex items-center gap-2 text-left`}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <TransitionLink 
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className={`w-full font-semibold transition-colors duration-200 ${buttonBg}`}>
                      Sign In
                    </Button>
                  </TransitionLink>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

