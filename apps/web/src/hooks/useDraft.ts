"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getServices } from "@/services";
import type { Draft } from "@/types/contracts";

export function useLatestDraft() {
  return useQuery<Draft | null>({
    queryKey: ["draft", "latest"],
    queryFn: async () => getServices().lists.getLatestDraft(),
  });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string | null }) =>
      getServices().lists.createDraft(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["draft", "latest"] });
    },
  });
}

