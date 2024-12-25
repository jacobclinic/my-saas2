// 'use client';

// import { useCallback, useState, useTransition } from 'react';
// import ModalComponent from '../base/ModalComponent';
// import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
// import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
// import SelectComponent from '../base/SelectComponent';
// import SessionsType, { SessionsWithTableData } from '~/lib/sessions/types/session';
// import useCsrfToken from '~/core/hooks/use-csrf-token';
// import { useSessionsDataQueryRevalidate } from '~/lib/sessions/hooks/use-fetch-session';
// import { updateSessionAction } from '~/lib/sessions/server-actions';
// import { EditIcon } from '~/assets/images/react-icons';

// export default function UpdateSessionModal({ sessionData, revalidateSessionsByClassIdDataFetch }: { 
//   sessionData: SessionsWithTableData;
//   revalidateSessionsByClassIdDataFetch?: () => void;
// }) {
//   const startTimeToLocal = new Date(sessionData?.startTime)
//     .toLocaleString('en-CA', { hour12: false })
//     .replace(', ', 'T')
//     .replace(/:\d{2}$/, '');
//   // console.log('startTimeToLocal', sessionData?.startTime);
//   // console.log('startTimeToLocal 2', startTimeToLocal);
  
//   const [date, setDate] = useState(startTimeToLocal?.split('T')[0] || '');
//   const [time, setTime] = useState(startTimeToLocal?.split('T')[1]?.slice(0, 5) || '');
//   const [title, setTitle] = useState(sessionData?.title || '');
//   const [description, setDescription] = useState(sessionData?.description || '');
//   const [classForSession, setClassForSession] = useState(sessionData?.classId || '');

//   const [isMutating, startTransition] = useTransition();
//   const csrfToken = useCsrfToken();

//   const { revalidateSessionsDataFetch } = useSessionsDataQueryRevalidate();

//   const resetToDefaultValues = useCallback(() => {
//     setDate(startTimeToLocal.split('T')[0] || '');
//     setTime(startTimeToLocal.split('T')[1]?.slice(0, 5) || '');
//     setTitle(sessionData?.title || '');
//     setDescription(sessionData?.description || '');
//     setClassForSession(sessionData?.classId || '');
//   }, [sessionData?.classId, sessionData?.description, sessionData?.title, startTimeToLocal]);

//   const handleSelectClassChange = (value: string) => {
//     setClassForSession(value);
//   };

//   const classForSessionOptions = [
//     { label: 'rrrrrrrrrrr', value: 'dafc400f-9ca2-4283-b517-6b3329a416cc' },
//   ];

//   const handleUpdateSession = useCallback(async () => {
//     const updatedSession: SessionsType = {
//       id: sessionData.id,
//       startTime: new Date(`${date}T${time}:00`).toISOString(),
//       classId: classForSession,
//       title,
//       description,
//     };

//     startTransition(async () => {
//       await updateSessionAction({ sessionId: sessionData.id, sessionData: updatedSession, csrfToken });
//       revalidateSessionsDataFetch();
//       revalidateSessionsByClassIdDataFetch && revalidateSessionsByClassIdDataFetch();

//     });

//     resetToDefaultValues();
//     // return router.push(`/sessions`);
//   }, [classForSession, csrfToken, date, description, resetToDefaultValues, revalidateSessionsDataFetch, sessionData.id, time, title]);

//   return (
//     <ModalComponent
//       modalName={<EditIcon />}
//       heading='Update'
//       onConfirm={handleUpdateSession}
//       onCancel={resetToDefaultValues}
//       width="600px"
//     >
//       <Section>
//         <SectionHeader
//           title={'Update Session Details'}
//           description={`Modify the session details below.`}
//         />
//         <SectionBody className={'space-y-4'}>
//           <TextFieldLabel className='flex flex-col items-start justify-start'>
//             Class Date and Time
//             <div className="flex gap-4 w-full mb-2 justify-between">
//               <TextFieldLabel className="flex flex-row items-center justify-start gap-1 flex-1">
//                 Date:
//                 <TextFieldInput
//                   className='justify-end'
//                   type="date"
//                   placeholder="Enter the Date"
//                   required
//                   value={date}
//                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
//                 />
//               </TextFieldLabel>
//               <TextFieldLabel className="flex flex-row items-center justify-start gap-1 flex-1">
//                 Time:
//                 <TextFieldInput
//                   className='justify-end'
//                   type="time"
//                   placeholder="Enter the time"
//                   required
//                   value={time}
//                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
//                 />
//               </TextFieldLabel>
//             </div>
//           </TextFieldLabel>
//           <TextFieldLabel className='flex flex-col items-start justify-start'>
//             Title
//             <TextFieldInput
//               placeholder="Enter the title"
//               required
//               value={title}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
//             />
//           </TextFieldLabel>
//           <TextFieldLabel className='flex flex-col items-start justify-start'>
//             Description
//             <TextFieldInput
//               placeholder="Enter the description"
//               required
//               value={description}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
//             />
//           </TextFieldLabel>
//           <TextFieldLabel className='flex flex-col items-start justify-start'>
//             Class
//             <SelectComponent
//               options={classForSessionOptions}
//               placeholder="Select a class..."
//               onChange={handleSelectClassChange}
//               value={classForSession}
//               className="w-full"
//               required
//             />
//           </TextFieldLabel>
//         </SectionBody>
//       </Section>
//     </ModalComponent>
//   );
// }
