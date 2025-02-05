// app/sessions/[id]/page.tsx

import { redirect } from "next/navigation";
import { getSessionDataById } from "~/lib/sessions/database/queries";
import getSupabaseServerComponentClient from "~/core/supabase/server-component-client";
// import { SessionJoinHandler } from "~/app/(app)/components/zoom/SessionJoinHandler";
// import { MeetingContainer } from "~/app/(app)/components/zoom/MeetingContainer";
import Script from "next/script";
import dynamic from "next/dynamic";

const Videocall = dynamic<{ slug: string; JWT: string }>(
  () => import("../../../components/zoom/Videocall"),
  { ssr: false },
);

export default async function MeetingPage({
  params
}: {
  params: { id: string }
}) {
	const client = getSupabaseServerComponentClient();
	const { data: { user }, error } = await client.auth.getUser();
	const session = await getSessionDataById(client, params.id);

	console.log("MeetingPage--------Session: ", session, user);

  if (!session || !user) {
    redirect("/upcoming-sessions");
  }

  const isHost = session?.class?.tutor_id === user.id;

  console.log("---------------------------------------MeetingPage--------isHost: ", 
    isHost, session.zoom_session_name);

  return (
    <main>
      <Videocall
        slug={session.zoom_session_name || ""}
        JWT={isHost ? session.zoom_host_token || "" : session.zoom_participant_token || ""}
      />
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
    </main>
  )

  // return (
  //   <MeetingContainer
  //     sessionData={{
  //       name: session.zoom_session_name || "",
  //       hostToken: session.zoom_host_token || "",
  //       participantToken: session.zoom_participant_token || "",
  //       isHost,
  //       userName: `${session?.class?.tutor?.first_name} ${session?.class?.tutor?.last_name}` || user.email || ""
  //     }}
  //   />
  // );

  // return (
  //   <div className="container py-8">
  //     <SessionJoinHandler
  //       sessionName={session.zoom_session_name || ""}
  //       hostToken={session.zoom_host_token || ""}
  //       participantToken={session.zoom_participant_token || ""}
  //       isHost={isHost}
  //       userName={`${session?.class?.tutor?.first_name} ${session?.class?.tutor?.last_name}`|| user.email || ""}
  //       onLeave={() => redirect("/dashboard")}
  //     />
  //   </div>
  // );
}