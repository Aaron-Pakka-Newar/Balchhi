"use client"

import { TransitionLink } from "@/components/page-transition"
import { Facebook, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] py-16">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <TransitionLink href="/" className="flex items-center gap-3 mb-4">
              <span 
                className="text-white text-2xl"
                style={{ fontFamily: "'Calmingly', cursive" }}
              >
                Balchhi
              </span>
            </TransitionLink>
            <p className="text-[#B3B3B3] text-sm leading-relaxed mb-6">
              Nepal's trusted platform for reuniting people with their lost belongings. 
              Connect, verify, and recover.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center text-white hover:bg-[#D4D4D4] hover:text-[#2B2B2B] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center text-white hover:bg-[#D4D4D4] hover:text-[#2B2B2B] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center text-white hover:bg-[#D4D4D4] hover:text-[#2B2B2B] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Platform</h4>
            <ul className="space-y-3">
              <li>
                <TransitionLink href="/browse" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Browse Listings
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/listing/create" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Report Item
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/dashboard" className="text-[#B3B3B3] hover:text-white transition-colors">
                  My Dashboard
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/dashboard/organization" className="text-[#B3B3B3] hover:text-white transition-colors">
                  For Organizations
                </TransitionLink>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Support</h4>
            <ul className="space-y-3">
              <li>
                <TransitionLink href="/help" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Help Center
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/safety" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Safety Tips
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/contact" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Contact Us
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/faq" className="text-[#B3B3B3] hover:text-white transition-colors">
                  FAQ
                </TransitionLink>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <TransitionLink href="/privacy" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Privacy Policy
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/terms" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Terms of Service
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/cookies" className="text-[#B3B3B3] hover:text-white transition-colors">
                  Cookie Policy
                </TransitionLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#3a3a3a] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#B3B3B3] text-sm">
            © 2025 Balchhi. All rights reserved.
          </p>
          <p className="text-[#B3B3B3] text-sm">
            Made with ❤️ in Nepal • नेपालमा बनेको
          </p>
        </div>
      </div>
    </footer>
  )
}

