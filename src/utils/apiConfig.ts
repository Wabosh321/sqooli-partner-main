/**
 * DEPRECATED: This file is no longer used.
 * Frontend now uses Supabase Auth and Edge Functions exclusively.
 * All API calls are routed through Supabase services.
 */

// Kept for backward compatibility but marked for removal
export const getApiUrl = (): string => '';

export const getApiEndpoint = (path: string): string => {
  console.warn('getApiEndpoint is deprecated. Use Supabase client directly.');
  return path;
};
