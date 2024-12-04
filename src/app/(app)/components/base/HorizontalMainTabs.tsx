'use client';

import classNames from 'clsx';
import { StarIcon } from '@heroicons/react/24/outline';
import Button from '~/core/ui/Button';
import { useState } from 'react';

interface HorizontalMainTabsProps {
    tabs: {
        name: string;
        hasPermission: boolean;
    }[];
    highlightedTabIndex?: number;
    tabAction?: (tab: any, index: number) => void;
}

export default function HorizontalMainTabs(props: HorizontalMainTabsProps) {
    const { tabs, highlightedTabIndex = 0, tabAction = () => {} } = props;
    const [currentTab, setCurrentTab] = useState(highlightedTabIndex);

    const handleTabClick = (tab: any, index: number) => {
      setCurrentTab(index);
      tabAction(tab, index);
    };

    return ( 
        <div className='flex flex-row gap-2'>
            {tabs?.filter((_item) => _item.hasPermission)?.map((tab, index) => (
                <Tab
                    key={index}
                    name={tab.name}
                    isActive={currentTab === index}
                    onClick={() => handleTabClick(tab, index)}
                />
            ))}
        </div>
    )
}

interface TabProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
}

// const Tab = (props: { name: string; isHighlighted: boolean, tabAction?: () => void; }) => {
const Tab = ({ name, isActive, onClick }: TabProps) => {
    const labelClassName = classNames(
        'hover:bg-accent hover:text-accent-foreground',
        {
            ['border-b border-gray-500']: isActive,
        }
    );
    return (
        <Button
            variant="custom"
            className={labelClassName}
            onClick={onClick}
        >
            {name}
        </Button>
    );
};