// lib/swrConfig.ts
import { SWRConfiguration } from "swr";

/**
 * Global fetcher function for SWR
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: any = new Error("An error occurred while fetching the data.");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * Default SWR configuration
 */
export const defaultSWRConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false, // Don't revalidate on window focus for better performance
  revalidateOnReconnect: true, // Revalidate when network reconnects
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  errorRetryCount: 3, // Retry failed requests 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
  shouldRetryOnError: true,
  // Long cache strategy - only revalidate on mount
  revalidateIfStale: false,
  revalidateOnMount: true,
};
