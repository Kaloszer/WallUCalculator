import { Metadata } from "next";
import { Suspense } from "react";
import HouseSampleClient from "./HouseSampleClient";

export const metadata: Metadata = {
  title: "House Sample",
  description: "Generated house sample with cost calculations",
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HouseSampleClient />
    </Suspense>
  );
}
