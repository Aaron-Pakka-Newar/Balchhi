"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Upload, X, MapPin, Calendar, Tag, FileText, Phone, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.string().min(1, "Select a category"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be under 1000 characters"),
  province: z.string().min(1, "Select a province"),
  district: z.string().min(1, "Select a district"),
  municipality: z.string().min(1, "Enter municipality/metro"),
  landmark: z.string().optional(),
  date: z.string().min(1, "Select the date"),
  time: z.string().optional(),
  reward: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
})

type ListingFormValues = z.infer<typeof listingSchema>

interface CreateListingFormProps {
  type?: 'lost' | 'found'
}

interface Category {
  id: string
  name: string
  name_ne: string
}

const provinces = [
  "Koshi Pradesh",
  "Madhesh Pradesh", 
  "Bagmati Pradesh",
  "Gandaki Pradesh",
  "Lumbini Pradesh",
  "Karnali Pradesh",
  "Sudurpashchim Pradesh",
]

const districtsByProvince: Record<string, string[]> = {
  "Koshi Pradesh": ["Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"],
  "Madhesh Pradesh": ["Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"],
  "Bagmati Pradesh": ["Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"],
  "Gandaki Pradesh": ["Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun"],
  "Lumbini Pradesh": ["Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Palpa", "Parasi", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"],
  "Karnali Pradesh": ["Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Rukum West", "Salyan", "Surkhet"],
  "Sudurpashchim Pradesh": ["Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"],
}

export default function CreateListingForm({ type = 'lost' }: CreateListingFormProps) {
  const router = useRouter()
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [selectedProvince, setSelectedProvince] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Fetch categories from database
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, name_ne')
          .order('name')
        
        if (error) {
          console.error('Error fetching categories:', error)
          return
        }
        
        setCategories(data || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }
    
    fetchCategories()
  }, [])

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      province: "",
      district: "",
      municipality: "",
      landmark: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      reward: "",
      contactPhone: "",
      contactEmail: "",
    },
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      alert("Maximum 5 images allowed")
      return
    }
    
    const newImages = [...images, ...files].slice(0, 5)
    setImages(newImages)
    
    // Create preview URLs
    const urls = newImages.map(file => URL.createObjectURL(file))
    setImageUrls(urls)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newUrls = imageUrls.filter((_, i) => i !== index)
    setImages(newImages)
    setImageUrls(newUrls)
  }

  async function onSubmit(values: ListingFormValues) {
    setIsLoading(true)
    try {
      if (!session) {
        alert("You must be logged in to create a listing")
        router.push("/auth/login")
        return
      }

      // Build location object
      const location = {
        province: values.province,
        district: values.district,
        municipality: values.municipality,
        landmark: values.landmark || "",
      }

      // Upload images first and collect URLs
      const uploadedMedia: { url: string; thumbnail_url?: string }[] = []
      
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split('.').pop() || 'jpg'
          const fileName = `${session.user.id}/${Date.now()}-${i}.${fileExt}`
          
          try {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("item-images")
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error("Image upload error:", uploadError)
              // If bucket doesn't exist, show a helpful message but continue
              if (uploadError.message?.includes('Bucket not found')) {
                console.warn("Storage bucket 'item-images' not found. Please create it in Supabase Dashboard > Storage.")
              }
              continue
            }

            // Get the public URL for the uploaded image
            const { data: urlData } = supabase.storage
              .from("item-images")
              .getPublicUrl(fileName)

            if (urlData?.publicUrl) {
              uploadedMedia.push({
                url: urlData.publicUrl,
                thumbnail_url: urlData.publicUrl,
              })
            }
          } catch (err) {
            console.error("Failed to upload image:", err)
          }
        }
      }

      // Prepare item data with media
      const itemData = {
        type,
        title: values.title,
        description: values.description,
        category_id: values.category,
        location,
        date_lost_found: values.date,
        time_lost_found: values.time || null,
        reward_amount: values.reward ? parseInt(values.reward) : null,
        contact_phone: values.contactPhone || null,
        contact_email: values.contactEmail || null,
        show_contact: true,
        media: uploadedMedia, // Include media URLs
      }

      // Call API to create item
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create listing")
      }

      alert("Listing created successfully!")
      router.push("/browse")
    } catch (error) {
      console.error("Failed to create listing:", error)
      alert(error instanceof Error ? error.message : "Failed to create listing. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-[#2B2B2B]">
            <Tag className="w-5 h-5" />
            <h3 className="font-bold text-lg">Basic Details</h3>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2B2B2B]">Item Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Silver Wedding Ring with Diamond" 
                    className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-[#2B2B2B]">
                  Be specific about what you {type === 'lost' ? 'lost' : 'found'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2B2B2B]">Category</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={categoriesLoading}
                    className="flex h-11 w-full rounded-lg border border-[#2B2B2B]/30 bg-white px-4 py-2 text-base focus:outline-none focus:border-[#2B2B2B] focus:ring-2 focus:ring-[#2B2B2B]/20 disabled:bg-gray-100"
                  >
                    <option value="">{categoriesLoading ? "Loading categories..." : "Select a category"}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-[#2B2B2B]">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-lg">Location</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">Province</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        setSelectedProvince(e.target.value)
                        form.setValue('district', '')
                      }}
                      className="flex h-11 w-full rounded-lg border border-[#2B2B2B]/30 bg-white px-4 py-2 text-base focus:outline-none focus:border-[#2B2B2B] focus:ring-2 focus:ring-[#2B2B2B]/20"
                    >
                      <option value="">Select province</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">District</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      disabled={!selectedProvince}
                      className="flex h-11 w-full rounded-lg border border-[#2B2B2B]/30 bg-white px-4 py-2 text-base focus:outline-none focus:border-[#2B2B2B] focus:ring-2 focus:ring-[#2B2B2B]/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select district</option>
                      {selectedProvince && districtsByProvince[selectedProvince]?.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="municipality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">Municipality / Metro</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Kathmandu Metropolitan City" 
                      className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="landmark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">Landmark (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Near Swayambhunath Temple" 
                      className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-[#2B2B2B]">
            <Calendar className="w-5 h-5" />
            <h3 className="font-bold text-lg">When</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">
                    Date {type === 'lost' ? 'Lost' : 'Found'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">Approximate Time (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-[#2B2B2B]">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold text-lg">Description</h3>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    placeholder="Describe the item in detail. Include color, size, brand, any unique marks, identifying features, etc."
                    className="flex min-h-32 w-full rounded-lg border border-[#2B2B2B]/30 bg-white px-4 py-3 text-base focus:outline-none focus:border-[#2B2B2B] focus:ring-2 focus:ring-[#2B2B2B]/20 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#2B2B2B]">
                  {field.value.length}/1000 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Photos */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-[#2B2B2B]">
            <Upload className="w-5 h-5" />
            <h3 className="font-bold text-lg">Photos</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-[#FFFFFF]">
                <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {images.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-[#2B2B2B]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#2B2B2B] hover:bg-[#D4D4D4]/10 transition-colors">
                <Upload className="w-8 h-8 text-[#2B2B2B] mb-2" />
                <span className="text-sm text-[#2B2B2B]">Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
          <p className="text-sm text-[#2B2B2B]">
            Add up to 5 photos to help identify the item
          </p>
        </div>

        {/* Contact & Reward */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-[#2B2B2B]">
            <Phone className="w-5 h-5" />
            <h3 className="font-bold text-lg">Contact & Reward</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="+977 98XXXXXXXX" 
                      className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">Email (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="your@email.com" 
                      className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {type === 'lost' && (
            <FormField
              control={form.control}
              name="reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2B2B2B]">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Reward Amount (Optional)
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="NPR 500" 
                      className="border-[#2B2B2B]/30 focus:border-[#2B2B2B]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-[#2B2B2B]">
                    Offer a reward to encourage the finder
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            className="border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#FFFFFF]"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="flex-1 bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-[#FFFFFF]"
          >
            {isLoading ? "Creating..." : `Post ${type === 'lost' ? 'Lost' : 'Found'} Item`}
          </Button>
        </div>
      </form>
    </Form>
  )
}

