"use client";

import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => getServices().auth.getSession(),
    staleTime: 60_000,
  });
}

