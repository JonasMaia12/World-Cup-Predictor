import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes — respects football-data.org 10 req/min limit
      refetchOnWindowFocus: false,
    },
  },
})
