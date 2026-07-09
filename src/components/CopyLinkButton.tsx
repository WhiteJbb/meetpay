"use client";

import { useState } from "react";

export default function CopyLinkButton({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface"
    >
      {copied ? "복사되었어요!" : label}
    </button>
  );
}
