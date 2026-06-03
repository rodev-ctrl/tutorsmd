import { Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';

import { RouterProvider } from './providers/RouterProvider';
import { useInitAuth } from './hooks/useInAuth';
import { Spinner } from '@shared/index';


export const App = () => {
  const { isReady } = useInitAuth();

  if (!isReady) {
    return <Spinner fullscreen />;
  }

  return (
    <HelmetProvider>
      <Suspense fallback={<Spinner fullscreen />}>
        <RouterProvider />
      </Suspense>
    </HelmetProvider>
  );
};
