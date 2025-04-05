'use client';

import { Suspense } from "react";
import dynamic from 'next/dynamic';

const HouseSampleClient = dynamic(
  () => import("./HouseSampleClient"),
  { ssr: false }
);

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HouseSampleClient />
    </Suspense>
  );
}
