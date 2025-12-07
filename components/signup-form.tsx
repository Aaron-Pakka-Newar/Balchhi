"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth, type UserRole } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["individual", "organization"] as const),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupForm() {
  const router = useRouter()
  const { signup } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "individual",
    },
  })

  // Check if email already exists
  const checkEmailExists = async (email: string) => {
    if (!email) return
    setEmailError(null)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle()
      
      if (data) {
        setEmailError("Email already registered")
      }
    } catch (err) {
      console.error("Error checking email:", err)
    }
  }

  // Check if phone already exists
  const checkPhoneExists = async (phone: string) => {
    if (!phone || phone.trim() === '') return
    setPhoneError(null)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle()
      
      if (data) {
        setPhoneError("Phone number already registered")
      }
    } catch (err) {
      console.error("Error checking phone:", err)
    }
  }

  async function onSubmit(values: SignupFormValues) {
    // Clear previous errors
    setEmailError(null)
    setPhoneError(null)
    
    // Check for existing email/phone before submitting
    const emailCheck = await supabase
      .from('profiles')
      .select('id')
      .eq('email', values.email.toLowerCase())
      .maybeSingle()
    
    if (emailCheck.data) {
      setEmailError("Email already registered")
      return
    }

    if (values.phone && values.phone.trim() !== '') {
      const phoneCheck = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', values.phone)
        .maybeSingle()
      
      if (phoneCheck.data) {
        setPhoneError("Phone number already registered")
        return
      }
    }

    setIsLoading(true)
    try {
      await signup(values.email, values.password, values.name, values.role as UserRole)
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Signup error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create account. Please try again."
      
      // Check if error is about existing email
      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
        setEmailError("Email already registered")
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRole = form.watch('role')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#2B2B2B] font-medium">Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your full name" 
                  className="border-[#D4D4D4] focus:border-[#2B2B2B] focus:ring-[#2B2B2B] placeholder:text-[#2B2B2B]/40" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#2B2B2B] font-medium">Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="your@email.com" 
                  type="email" 
                  className="border-[#D4D4D4] focus:border-[#2B2B2B] focus:ring-[#2B2B2B] placeholder:text-[#2B2B2B]/40" 
                  {...field}
                  onBlur={(e) => {
                    field.onBlur()
                    checkEmailExists(e.target.value)
                  }}
                  onChange={(e) => {
                    field.onChange(e)
                    setEmailError(null)
                  }}
                />
              </FormControl>
              <FormMessage className="text-red-600" />
              {emailError && <p className="text-sm font-medium text-red-600">{emailError}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#2B2B2B] font-medium">Phone Number <span className="text-[#2B2B2B]/50 font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="+977 98XXXXXXXX" 
                  type="tel" 
                  className="border-[#D4D4D4] focus:border-[#2B2B2B] focus:ring-[#2B2B2B] placeholder:text-[#2B2B2B]/40" 
                  {...field}
                  onBlur={(e) => {
                    field.onBlur()
                    checkPhoneExists(e.target.value)
                  }}
                  onChange={(e) => {
                    field.onChange(e)
                    setPhoneError(null)
                  }}
                />
              </FormControl>
              <FormMessage className="text-red-600" />
              {phoneError && <p className="text-sm font-medium text-red-600">{phoneError}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#2B2B2B] font-medium">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Must have at least 6 characters" 
                    type={showPassword ? "text" : "password"} 
                    className="border-[#D4D4D4] focus:border-[#2B2B2B] focus:ring-[#2B2B2B] pr-10 placeholder:text-[#2B2B2B]/40" 
                    {...field} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 hover:text-[#2B2B2B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#2B2B2B] font-medium">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Re-enter your password" 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="border-[#D4D4D4] focus:border-[#2B2B2B] focus:ring-[#2B2B2B] pr-10 placeholder:text-[#2B2B2B]/40" 
                    {...field} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 hover:text-[#2B2B2B] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="pt-2">
              <FormLabel className="text-[#2B2B2B] font-medium">Account Type</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3 pt-2">
                  <label 
                    htmlFor="individual" 
                    className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      field.value === 'individual' 
                        ? 'border-[#2B2B2B] bg-[#2B2B2B]/5' 
                        : 'border-[#D4D4D4] hover:border-[#2B2B2B]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="individual" id="individual" className="border-[#2B2B2B] text-[#2B2B2B]" />
                      <span className="text-sm font-semibold text-[#2B2B2B]">Individual</span>
                    </div>
                    <p className="text-xs text-[#2B2B2B]/50 mt-1 ml-6">Post and find lost items</p>
                  </label>
                  <label 
                    htmlFor="organization" 
                    className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      field.value === 'organization' 
                        ? 'border-[#2B2B2B] bg-[#2B2B2B]/5' 
                        : 'border-[#D4D4D4] hover:border-[#2B2B2B]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="organization" id="organization" className="border-[#2B2B2B] text-[#2B2B2B]" />
                      <span className="text-sm font-semibold text-[#2B2B2B]">Organization</span>
                    </div>
                    <p className="text-xs text-[#2B2B2B]/50 mt-1 ml-6">Manage team & listings</p>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage className="text-red-600" />
            </FormItem>
          )}
        />

        {/* Organization description field, only show if role is organization */}
        {selectedRole === 'organization' && (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2B2B2B] font-medium">Organization Description</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Describe your organization" 
                    className="border-[#D4D4D4] focus:border-[#2B2B2B] focus:ring-[#2B2B2B] placeholder:text-[#2B2B2B]/40" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-600" />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white font-semibold py-5 mt-4 transition-colors" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  )
}

