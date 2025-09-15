-- CreateTable
CREATE TABLE "public"."ItemWork" (
    "itemId" INTEGER NOT NULL,
    "workId" INTEGER NOT NULL,

    CONSTRAINT "ItemWork_pkey" PRIMARY KEY ("itemId")
);

-- CreateIndex
CREATE INDEX "ItemWork_workId_idx" ON "public"."ItemWork"("workId");

-- AddForeignKey
ALTER TABLE "public"."ItemWork" ADD CONSTRAINT "ItemWork_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemWork" ADD CONSTRAINT "ItemWork_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
