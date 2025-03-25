"use client";

import { useState } from 'react';

export function useClipboard() {
  const [error, setError] = useState<Error | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  };

  return { copy, error };
}