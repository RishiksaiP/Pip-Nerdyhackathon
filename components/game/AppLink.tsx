import type { ComponentProps } from 'react';

// Document navigation avoids the beta Worker's broken RSC link prefetch path.
// SessionProvider restores validated progress before each screen becomes interactive.
export default function AppLink(props: ComponentProps<'a'>) {
  return <a {...props} />;
}
