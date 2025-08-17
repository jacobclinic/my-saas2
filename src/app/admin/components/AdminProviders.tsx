'use client';

import CsrfTokenContext from '~/lib/contexts/csrf';

function AdminProviders(
  props: React.PropsWithChildren<{
    csrfToken: string | null;
  }>,
) {
  return (
    <CsrfTokenContext.Provider value={props.csrfToken}>
      {props.children}
    </CsrfTokenContext.Provider>
  );
}

export default AdminProviders;
