// 'use client';

// import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
// import HorizontalMainTabs from '../../base/HorizontalMainTabs';
// import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
// import Button from '~/core/ui/Button';
// import Filter from '../../base/Filter';
// import { ClassWithTutorAndEnrollment } from '~/lib/classes/types/class';
// import SelectComponent from '../../base/SelectComponent';
// import { useState } from 'react';
// import ClassViewDetails from './ClassViewDetails';
// import useSessionsDataQuery, { useSessionsDataByClassIdQuery } from '~/lib/sessions/hooks/use-fetch-session';
// import SessionsList from '../../sessions/SessionsList';

// interface SearchBarProps {
//     classData: ClassWithTutorAndEnrollment;
// }

// export default function ClassView({ classData }: SearchBarProps) {
//     const { data: sessions, error, isLoading, revalidate: revalidateSessionsByClassIdDataFetch } = useSessionsDataByClassIdQuery(classData.id);
//     const tabsArray = [
//       { name: 'Details', hasPermission: true },
//       { name: 'Students', hasPermission: true },
//       { name: 'Sessions', hasPermission: true },
//       { name: 'Payments', hasPermission: true },
//     ];
//     const [activeTabIndex, setActiveTabIndex] = useState(0);

//     const renderActiveTabContent = () => {
//         switch (activeTabIndex) {
//             case 0:
//                 return <ClassViewDetails classData={classData} />;
//             case 1:
//                 return <div className='mt-8'>Students List</div>;
//             case 2:
//                 return <SessionsList sessionData={sessions || []} classId={classData.id} revalidateSessionsByClassIdDataFetch={revalidateSessionsByClassIdDataFetch} />;
//             case 3:
//                 return <div className='mt-8'>Payments List</div>;
//             default:
//                 return null;
//         }
//     };

//     return ( 
//         <>
//             <HorizontalMainTabs
//                 tabs={tabsArray}
//                 tabAction={(tab, index) => setActiveTabIndex(index)}
//                 highlightedTabIndex={activeTabIndex}
//             />
//             {renderActiveTabContent()}
//         </>
//     )
// }