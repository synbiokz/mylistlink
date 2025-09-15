"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getServices } from "@/services";
import type { Slot } from "@/types/contracts";
import type { ApiError } from "@/types/errors";

export function useSetSlot(listId: number) {
  const qc = useQueryClient();
  return useMutation<{ slots: Slot[]; error?: ApiError }, unknown, { itemId: number; position: number; clientRequestId?: string }>(
    {
      mutationFn: async (vars) => getServices().lists.setSlot(listId, vars.itemId, vars.position, { clientRequestId: vars.clientRequestId }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["draft", "latest"] });
      },
    }
  );
}

export function useRemoveSlot(listId: number) {
  const qc = useQueryClient();
  return useMutation<{ slots: Slot[]; error?: ApiError }, unknown, { position: number }>(
    {
      mutationFn: async (vars) => getServices().lists.removeSlot(listId, vars.position),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["draft", "latest"] });
      },
    }
  );
}

export function usePublishList(listId: number) {
  return useMutation({
    mutationFn: async () => getServices().lists.publish(listId),
  });
}

