import dynamic from 'next/dynamic';
import type { ExplodedWallViewProps } from './ExplodedWallViewClient'; // Import type only

// Dynamically import the client component with SSR disabled
const ExplodedWallViewClient = dynamic(
  () => import('./ExplodedWallViewClient'), // Default export is expected
  { ssr: false }
);

// Export the wrapper component
export function ExplodedWallView(props: ExplodedWallViewProps) {
  // Render the dynamically imported client component
  return <ExplodedWallViewClient {...props} />;
}
