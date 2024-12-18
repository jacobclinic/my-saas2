import useSupabase from '~/core/hooks/use-supabase';
import useSWRMutation from 'swr/mutation';
import configuration from '~/configuration';
import { useRouter } from 'next/navigation';
import sendEmail from '~/core/email/send-email';

interface AdminUserCreationParams {
  email: string;
  userRole: string;
  fullName?: string;
}

function useAdminCreateUser() {
  const client = useSupabase();
  const router = useRouter();
  const key = ['admin', 'create-user'];

  return useSWRMutation(
    key,
    async (_, { arg }: { arg: AdminUserCreationParams }) => {
      // Generate a secure random password
      const password = generateSecurePassword();

      // Sign up the user
      const { data, error } = await client.auth.signUp({
        email: arg.email,
        password: password,
        options: {
          data: {
            userRole: arg.userRole,
            fullName: arg.fullName,
            createdByAdmin: true
          }
        }
      });

      if (error) throw error;

      // Send welcome email with credentials
      // await sendEmail({
      //   from: configuration.email.fromAddress || "noreply@yourinstitute.com", 
      //   to: arg.email,
      //   subject: 'Your New Account Credentials',
      //   html: `
      //     <p>Dear ${arg.fullName || 'User'},</p>
      //     <p>An account has been created for you with the following credentials:</p>
      //     <p>Email: ${arg.email}</p>
      //     <p>Temporary Password: ${password}</p>
      //     <p>Please log in and change your password immediately.</p>
      //     <p>Best regards,<br>Your Institute Admin Team</p>
      //   `
      // });


      return data;
    },
    {
      onSuccess: () => router.refresh(),
    },
  );
}

// Utility function to generate a secure random password
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
}

export default useAdminCreateUser;