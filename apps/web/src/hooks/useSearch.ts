"use client";

import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services";
import type { SearchItem } from "@/types/contracts";
import type { GroupedWorkItem } from "@/types/search-grouped";

export function useSourcesSearch(q: string, opts?: { type?: string; limit?: number; enabled?: boolean }) {
  const enabled = (opts?.enabled ?? true) && q.trim().length >= 3;
  return useQuery<SearchItem[]>({
    queryKey: ["search:sources", q, opts?.type, opts?.limit],
    queryFn: async () => getServices().search.search(q, { type: opts?.type, limit: opts?.limit }),
    enabled,
  });
}

export function useGroupedSearch(q: string, opts?: { type?: string; limit?: number; expand?: boolean; enabled?: boolean }) {
  const enabled = (opts?.enabled ?? true) && q.trim().length >= 3;
  return useQuery<GroupedWorkItem[]>({
    queryKey: ["search:grouped", q, opts?.type, opts?.limit, opts?.expand === true],
    queryFn: async () => getServices().search.searchGrouped(q, { type: opts?.type, limit: opts?.limit, expand: opts?.expand }),
    enabled,
  });
}
