"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-center"
      closeButton
      toastOptions={{
        style: {
          borderRadius: "14px",
          border: "1px solid #000225",
          background: "rgba(26,58,102,0.98)",
          color: "#F8F9FA",
          boxShadow: "0 16px 28px rgba(0, 0, 0, 0.28)",
          backdropFilter: "blur(4px)",
        },
      }}
    />
  );
}
