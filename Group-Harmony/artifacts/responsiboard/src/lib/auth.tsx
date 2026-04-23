import { useGetCurrentUser } from "@workspace/api-client-react";

export function useCurrentUser() {
  const q = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  });
  return {
    user: q.data ?? null,
    isLoading: q.isLoading,
    isAuthed: !!q.data,
    error: q.error,
  };
}
