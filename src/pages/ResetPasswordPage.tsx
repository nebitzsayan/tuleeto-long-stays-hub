import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Confirm password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Check if user arrived via password reset link
  useEffect(() => {
    const checkResetToken = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        toast.error('Invalid or expired reset link');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    checkResetToken();
  }, [navigate]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) {
        toast.error(error.message || 'Failed to reset password');
        return;
      }

      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tuleeto-orange"></div>
      </div>
    );
  }

  if (isValidToken === false) {
    return null; // Will redirect to /auth
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow pt-20 px-4 pb-16 bg-tuleeto-off-white">
        <div className="container max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-tuleeto-orange rounded-full">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your new password" 
                          {...field} 
                          type="password" 
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Confirm your new password" 
                          {...field} 
                          type="password" 
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
