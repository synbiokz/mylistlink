"use client";

import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await getServices().users?.getMe()) ?? null,
    // Ensure header reflects auth changes immediately after sign in/out
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
