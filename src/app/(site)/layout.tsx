import Footer from './components/Footer';
import SiteHeaderSessionProvider from './components/SiteHeaderSessionProvider';
import loadUserData from '~/lib/server/loaders/load-user-data';

async function SiteLayout(props: React.PropsWithChildren) {
  const data = await loadUserData();

  return (
    <>
      {props.children}
      {/* <Footer /> */}
    </>
  );
}

export default SiteLayout;
