'use client';

import classNames from 'clsx';
import { StarIcon } from '@heroicons/react/24/outline';
import Button from '~/core/ui/Button';

interface HorizontalMainTabsProps {
    tabs: {
        name: string;
        hasPermission: boolean;
    }[];
    highlightedTabIndex?: number;
    tabAction?: (tab: any, index: number) => void;
}

const Tab = (props: { name: string; isHighlighted: boolean, tabAction?: () => void; }) => {
    const { name, isHighlighted, tabAction = () => {} } = props;

    const labelClassName = classNames(
        'hover:bg-accent hover:text-accent-foreground',
        {
            ['border-b border-gray-300']: isHighlighted,
        }
    );
    return (
        <Button
            variant="custom"
            className={labelClassName}
            onClick={() => tabAction()}
        >
            {name}
        </Button>
    );
};

export default function HorizontalMainTabs(props: HorizontalMainTabsProps) {
    const { tabs, highlightedTabIndex = 0, tabAction = () => {} } = props;

    return ( 
        <div className='flex flex-row gap-2'>
            {tabs?.filter((_item) => _item.hasPermission)?.map((tab, index) => (
                <Tab
                    key={index}
                    name={tab.name}
                    isHighlighted={highlightedTabIndex === index}
                    tabAction={() => tabAction(tab, index)}
                />
            ))}
        </div>
    )
}