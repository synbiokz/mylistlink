"use client";

import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services";
import type { BookSearchResult } from "@/types/contracts";

export function useBookSearch(q: string, opts?: { limit?: number; enabled?: boolean }) {
  const enabled = (opts?.enabled ?? true) && q.trim().length >= 3;
  return useQuery<BookSearchResult[]>({
    queryKey: ["books:search", q, opts?.limit],
    queryFn: async () => getServices().books.search(q, { limit: opts?.limit }),
    enabled,
  });
}
