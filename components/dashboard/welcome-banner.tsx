"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface WelcomeBannerProps {
  workspaceName: string;
  role: string;
}

export function WelcomeBanner({ workspaceName, role }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-emerald-500 px-6 py-3 flex items-center justify-between text-white text-sm">
      <span>
        Welcome to <strong>{workspaceName}</strong>! You&apos;re now a{" "}
        <strong>{roleLabel}</strong> on this workspace.
      </span>
      <button
        onClick={() => setVisible(false)}
        className="ml-4 rounded p-0.5 hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
