'use client';

import HorizontalMainTabs from '../../base/HorizontalMainTabs';
import { useState } from 'react';
import { SessionsWithTableData } from '~/lib/sessions/types/session';
// import SessionViewDetails from './SessionViewDetails';

interface SearchBarProps {
    sessionData: SessionsWithTableData;
}

export default function SessionView({ sessionData }: SearchBarProps) {
    const tabsArray = [
      { name: 'Details', hasPermission: true },
      { name: 'Attendance', hasPermission: true },
    ];
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const renderActiveTabContent = () => {
        switch (activeTabIndex) {
            case 0:
                return null;
                // return <SessionViewDetails sessionData={sessionData} />;
            case 1:
                return <div className='mt-8'>Attendance List</div>;
            default:
                return null;
        }
    };

    return ( 
        <>
            <HorizontalMainTabs
                tabs={tabsArray}
                tabAction={(tab, index) => setActiveTabIndex(index)}
                highlightedTabIndex={activeTabIndex}
            />
            {renderActiveTabContent()}
        </>
    )
}