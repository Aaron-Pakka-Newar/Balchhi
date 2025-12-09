"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOrganization } from "@/contexts/organization-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Building } from "lucide-react"
import type { Database } from "@/lib/database.types"

type OrganizationType = Database["public"]["Enums"]["organization_type"]

const organizationTypes: { value: OrganizationType; label: string }[] = [
  { value: "police", label: "Police Station" },
  { value: "traffic_police", label: "Traffic Police" },
  { value: "airport", label: "Airport" },
  { value: "bus_park", label: "Bus Park" },
  { value: "hotel", label: "Hotel" },
  { value: "mall", label: "Mall/Shopping Center" },
  { value: "university", label: "University" },
  { value: "college", label: "College" },
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "bank", label: "Bank" },
  { value: "other", label: "Other" },
]

const createOrgSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["police", "traffic_police", "airport", "bus_park", "hotel", "mall", "university", "college", "school", "hospital", "bank", "other"] as const),
  contact_email: z.string().email("Invalid email address"),
  contact_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
})

type CreateOrgFormValues = z.infer<typeof createOrgSchema>

export default function CreateOrgDialog() {
  const { user } = useAuth()
  const { createOrganization, isLoading: orgLoading, error: orgError } = useOrganization()
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "other",
      contact_email: "",
      contact_phone: "",
      address: "",
    },
  })

  // Update contact_email when user becomes available
  useEffect(() => {
    if (user?.email && !form.getValues('contact_email')) {
      form.setValue('contact_email', user.email)
    }
  }, [user?.email, form])

  async function onSubmit(values: CreateOrgFormValues) {
    if (!user) return

    setIsLoading(true)
    try {
      const newOrg = await createOrganization({
        name: values.name,
        description: values.description,
        type: values.type,
        contact_email: values.contact_email,
        contact_phone: values.contact_phone,
        address: values.address,
        location: { lat: 0, lng: 0 }, // Default location, can be updated later
      })

      if (newOrg) {
        toast({
          title: "Success",
          description: "Organization created successfully",
        })
        setOpen(false)
        form.reset()
        router.push("/dashboard/organization")
      } else {
        toast({
          title: "Error",
          description: orgError || "Failed to create organization",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Building className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Set up an organization account to manage multiple listings and staff</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Local Police Station" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Describe your organization and its mission"
                      className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@organization.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+977 9800000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address of your organization" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

