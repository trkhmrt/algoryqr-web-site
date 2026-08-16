"use client";

import { Suspense } from "react";

import Login from "@/views/Login";

export default function LoginRoute() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
