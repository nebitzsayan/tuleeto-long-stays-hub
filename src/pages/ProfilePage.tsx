
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadAvatar, checkBucketExists } from "@/lib/supabaseStorage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bucketStatus, setBucketStatus] = useState<boolean | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: user?.email || "",
    },
  });

  // Check if avatars bucket exists on component mount
  useEffect(() => {
    const checkAvatarsBucket = async () => {
      if (user) {
        try {
          const exists = await checkBucketExists('avatars');
          setBucketStatus(exists);
          console.log("Avatars bucket status:", exists ? "Exists" : "Does not exist");
        } catch (err) {
          console.error("Error checking avatar bucket:", err);
          setBucketStatus(false);
        }
      }
    };
    
    checkAvatarsBucket();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      form.reset({
        fullName: userProfile.full_name || "",
        email: userProfile.email || user?.email || "",
      });
      setIsLoading(false);
    }
  }, [userProfile, user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.fullName,
        })
        .eq("id", user.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully!");
      await refreshProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadError(null);
      const files = event.target.files;
      if (!files || files.length === 0 || !user) {
        return;
      }

      setUploadingAvatar(true);
      const file = files[0];
      
      // Validate file size
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 5MB limit. Please choose a smaller image.");
        setUploadingAvatar(false);
        setUploadError("File size exceeds 5MB limit");
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload a JPEG, PNG, GIF, or WEBP image.");
        setUploadingAvatar(false);
        setUploadError("Invalid file type");
        return;
      }
      
      console.log("Attempting to upload avatar");
      const avatarUrl = await uploadAvatar(file, user.id);
      
      if (!avatarUrl) {
        toast.error("Failed to upload avatar. Please try again later.");
        setUploadingAvatar(false);
        setUploadError("Upload failed");
        return;
      }

      toast.success('Avatar updated successfully!');
      await refreshProfile();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(`Avatar upload failed: ${error.message}`);
      setUploadError(error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-24 px-4 pb-12 bg-tuleeto-off-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow pt-24 px-4 pb-12 bg-tuleeto-off-white">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">My Profile</h1>

          {bucketStatus === true && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Storage system is ready for avatar uploads.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2 mb-4 md:mb-0">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={userProfile?.avatar_url || ""} 
                      alt={userProfile?.full_name || "User"} 
                    />
                    <AvatarFallback className="bg-tuleeto-orange text-white">
                      {userProfile?.full_name ? (
                        userProfile.full_name
                          .split(' ')
                          .map(name => name[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)
                      ) : (
                        <User className="h-12 w-12" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                    />
                  </div>
                  {uploadError && (
                    <p className="text-sm text-red-500 mt-1 text-center max-w-[200px]">{uploadError}</p>
                  )}
                </div>

                <div className="flex-grow w-full">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          "Update Profile"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
