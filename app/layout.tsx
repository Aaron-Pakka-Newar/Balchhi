import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { VerificationProvider } from "@/contexts/verification-context"
import { OrganizationProvider } from "@/contexts/organization-context"
import { SearchProvider } from "@/contexts/search-context"
import { PageTransitionProvider } from "@/components/page-transition"
import "./globals.css"
import { Suspense } from "react"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Balchhi – Nepal Lost & Found",
  description: "Nepal's trusted platform for reuniting people with their lost belongings. Find what you've lost or help others recover their valuables.",
  keywords: ["lost and found", "Nepal", "Kathmandu", "lost items", "found items", "Balchhi"],
  authors: [{ name: "Balchhi" }],
  openGraph: {
    title: "Balchhi – Nepal Lost & Found",
    description: "Nepal's trusted platform for reuniting people with their lost belongings.",
    type: "website",
    locale: "en_NP",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#2B2B2B",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable} style={{ backgroundColor: '#FFFFFF' }}>
      <body className="font-sans antialiased" style={{ backgroundColor: '#FFFFFF' }}>
        <Suspense>
          <AuthProvider>
            <VerificationProvider>
              <OrganizationProvider>
                <SearchProvider>
                  <PageTransitionProvider>
                    {children}
                  </PageTransitionProvider>
                </SearchProvider>
              </OrganizationProvider>
            </VerificationProvider>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}

