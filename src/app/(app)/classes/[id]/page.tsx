import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import Stepper from '~/core/ui/Stepper';
import HorizontalMainTabs from '../../components/base/HorizontalMainTabs';
import ClassView from '../../components/classes/ClassView';

const ClassesList = loadDynamic(
  () => import('~/app/(app)/components/classes/ClassesList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Classes',
};

export default function ClassViewPage() {


  return (
    <>
      <AppHeader
        title={'Economics 2024 AL'}
        description={
          ""
        }
      />

      <PageBody>
        <ClassView />
      </PageBody>
    </>
  );
};

