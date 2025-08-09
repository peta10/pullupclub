import React from "react";
import Home from "../components/pages/Home/Home";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return <Home />;
}