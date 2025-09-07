"use server";

import prisma from "@/lib/prisma";
import { createDraft, addOrUpdateItem, publishList } from "@/data/lists";
import { resolveOrCreateItem } from "@/data/items";

export async function actionCreateDraft(ownerId: number, title: string, description?: string) {
  return createDraft(ownerId, title, description);
}

export async function actionUpsertListItem(listId: number, position: number, item: { title?: string; url?: string | null }) {
  const i = await resolveOrCreateItem(item);
  return addOrUpdateItem(listId, i.id, position);
}

export async function actionPublish(listId: number) {
  return publishList(listId);
}

