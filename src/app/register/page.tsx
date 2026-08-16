"use client";

import { Suspense } from "react";

import Register from "@/views/Register";

export default function RegisterRoute() {
  return (
    <Suspense fallback={null}>
      <Register />
    </Suspense>
  );
}
