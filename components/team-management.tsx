"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOrganization, type Organization, type StaffRole, type OrgMemberRole } from "@/contexts/organization-context"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "staff"] as const),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface TeamManagementProps {
  organization: Organization
}

export default function TeamManagement({ organization }: TeamManagementProps) {
  const { addMember, removeMember, updateMemberRole } = useOrganization()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "staff",
    },
  })

  async function onSubmit(values: InviteFormValues) {
    setIsLoading(true)
    try {
      // Note: In a real implementation, you would first lookup the user by email
      // or send an invitation. For now, we'll just show a placeholder
      await addMember(organization.id, {
        userId: "", // This should be the actual user ID from lookup
        name: values.email.split("@")[0],
        email: values.email,
        role: values.role,
        memberRole: values.role === "admin" ? "org_admin" : values.role === "manager" ? "org_manager" : "org_staff",
      })

      toast({
        title: "Success",
        description: `Invitation sent to ${values.email}`,
      })
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await removeMember(organization.id, memberId)
      toast({
        title: "Success",
        description: "Member removed from organization",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  async function handleUpdateRole(memberId: string, newRole: StaffRole) {
    try {
      await updateMemberRole(organization.id, memberId, newRole)
      toast({
        title: "Success",
        description: "Member role updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Team Member</CardTitle>
          <CardDescription>Invite staff to help manage your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="team@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({organization.members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {organization.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members yet</p>
          ) : (
            <div className="space-y-3">
              {organization.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(role) => handleUpdateRole(member.id, role as StaffRole)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

