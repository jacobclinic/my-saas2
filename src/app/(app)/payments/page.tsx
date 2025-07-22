import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import TutorPayments from '~/app/(app)/components/payments/TutorPaymentList';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import {
  Alert,
  AlertDescription,
} from '~/app/(app)/components/base-v2/ui/Alert';
import { Info } from 'lucide-react';
import AdminPaymentsPanel from '~/app/(app)/components/admin-payments/AdminPaymentsPanel';
import StudentPaymentsView from '~/app/(app)/components/student-payments/StudentPaymentsView';
import { getAllStudentPayments } from '~/lib/payments/database/queries';
import { getAllTutorInvoices } from '~/lib/invoices/database/queries';

export const metadata = {
  title: 'Payments Management',
};

async function PaymentsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const client = getSupabaseServerComponentClient();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  try {
    // Get user and handle authentication
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    // Handle authentication error
    if (authError || !user?.id) {
      console.error('Authentication error:', authError);
      redirect('/auth/sign-in');
    }

    // Get user role
    const { data: userData, error: userError } = await client
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    const userRole = userData?.user_role || 'unknown';
    const selectedPeriod = searchParams.month || currentMonth;

    // Render appropriate component based on user role
    if (userRole === 'admin') {
      // For administrators, show the full payment management interface
      try {
        // Fetch data for the selected period on the server
        const [studentPaymentsResult, tutorInvoices] = await Promise.all([
          getAllStudentPayments(client, selectedPeriod),
          getAllTutorInvoices(client, selectedPeriod),
        ]);

        const studentPayments = studentPaymentsResult.paymentData || [];
        const tutorInvoicesData = tutorInvoices || [];

        return (
          <>
            <PageBody>
              <Suspense
                fallback={
                  <div className="flex justify-center py-8">
                    Loading payments dashboard...
                  </div>
                }
              >
                <AdminPaymentsPanel
                  studentPayments={studentPayments}
                  tutorInvoices={tutorInvoicesData}
                  selectedPeriod={selectedPeriod}
                />
              </Suspense>
            </PageBody>
          </>
        );
      } catch (dataError) {
        console.error('Error fetching payment data:', dataError);
        throw dataError;
      }
    } else if (userRole === 'tutor') {
      // For tutors, show only their payment history
      return (
        <>
          <AppHeader
            title="Tutor Payments"
            description="View your payment history and upcoming payments"
          />
          <PageBody>
            <TutorPayments />
          </PageBody>
        </>
      );
    } else if (userRole === 'student') {
      // For students, show their invoices and payment options
      return (
        <>
          <AppHeader
            title="My Payments"
            description="View and manage your class fee payments"
          />
          <PageBody>
            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  Loading your invoices...
                </div>
              }
            >
              <StudentPaymentsView />
            </Suspense>
          </PageBody>
        </>
      );
    } else {
      // Unknown roles should not access this page
      redirect('/dashboard');
    }
  } catch (error) {
    // Handle any errors
    console.error('Admin payments page error:', error);
    return (
      <>
        <AppHeader
          title="Payments Error"
          description="We encountered an error while loading the payments page"
        />
        <PageBody>
          <Alert className="bg-red-50 border-red-200">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Unable to load payments data. Please try refreshing the page or
              contact support if the problem persists.
            </AlertDescription>
          </Alert>
        </PageBody>
      </>
    );
  }
}

export default PaymentsPage;
