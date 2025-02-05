// app/registration/success/page.tsx
import React from "react";
import getSupabaseServerComponentClient from "../../../../core/supabase/server-component-client";
import RegistrationSuccess from '../../components/student-registration/RegistrationSuccess';

interface PageProps {
  searchParams: {
    userId: string;
  };
}

export default async function SuccessPage({ searchParams }: PageProps) {
  // Fetch user and class details
  const client = getSupabaseServerComponentClient();
  const { data: { user: authUser }, error } = await client.auth.getUser();
  
  if (!authUser) {
    throw new Error("User not authenticated");
  }
  if (error) {
    throw new Error(error.message);
  }

  const { data: user } = await client
    .from('users')
    .select('*, student_class_enrollments(*, classes(*))')
    .eq('id', authUser.id)
    .single();

  const studentDetails = {
    username: authUser?.email || "",
    password: authUser?.user_metadata?.temporary_password || "",
    email: authUser?.email || "",
    nextClass: {
    //   date: formatDate(user.student_class_enrollments[0].classes.next_session),
    //   time: formatTime(user.student_class_enrollments[0].classes.time_slots[0]),
      date: "",
      time: "",
    //   zoomLink: user.student_class_enrollments[0].classes.zoom_link,
      zoomLink: "",
    },
    // materials: user.student_class_enrollments[0].classes.materials || [],
    materials: [],
  };

  return <RegistrationSuccess studentDetails={studentDetails} />;
}
