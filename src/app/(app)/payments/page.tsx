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
import { getAllStudentPayments } from '~/lib/payments/database/queries';
import { getPaymentSummaryForPage } from './actions';

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
    const selectedPeriod = searchParams.month || currentMonth; // Default to January 2025

    // Render appropriate component based on user role
    if (userRole === 'admin') {
      // For administrators, show the full payment management interface
      try {
        // Fetch initial payment data for admin
        const paymentsData = await getAllStudentPayments(
          client,
          selectedPeriod,
        );

        // Get payment summary statistics using our new server action
        const summaryResult = await getPaymentSummaryForPage();
        const summary = summaryResult.success ? summaryResult.summary : null;

        return (
          <>
            <AppHeader
              title="Student Payments"
              description="Manage and verify student payments for all classes"
            />
            <PageBody>
              <Suspense
                fallback={
                  <div className="flex justify-center py-8">
                    Loading payments data...
                  </div>
                }
              >
                <AdminPaymentsPanel
                  initialPayments={paymentsData}
                  initialSummary={summary || null}
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
    } else {
      // Students and other roles should not access this page
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
