-- CreateEnum
CREATE TYPE "public"."WorkKind" AS ENUM ('Book', 'Movie', 'TVSeries', 'Album', 'Track', 'Comic', 'Game', 'Other');

-- CreateTable
CREATE TABLE "public"."Work" (
    "id" SERIAL NOT NULL,
    "kind" "public"."WorkKind" NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "creator" TEXT,
    "qid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExternalId" (
    "id" SERIAL NOT NULL,
    "workId" INTEGER NOT NULL,
    "authority" TEXT NOT NULL,
    "extId" TEXT NOT NULL,

    CONSTRAINT "ExternalId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkMeta" (
    "workId" INTEGER NOT NULL,
    "summary" JSONB NOT NULL,

    CONSTRAINT "WorkMeta_pkey" PRIMARY KEY ("workId")
);

-- CreateTable
CREATE TABLE "public"."ListWork" (
    "listId" INTEGER NOT NULL,
    "workId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListWork_pkey" PRIMARY KEY ("listId","workId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Work_qid_key" ON "public"."Work"("qid");

-- CreateIndex
CREATE INDEX "Work_title_idx" ON "public"."Work"("title");

-- CreateIndex
CREATE INDEX "ExternalId_workId_idx" ON "public"."ExternalId"("workId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalId_authority_extId_key" ON "public"."ExternalId"("authority", "extId");

-- CreateIndex
CREATE INDEX "ListWork_listId_idx" ON "public"."ListWork"("listId");

-- CreateIndex
CREATE INDEX "ListWork_workId_idx" ON "public"."ListWork"("workId");

-- AddForeignKey
ALTER TABLE "public"."ExternalId" ADD CONSTRAINT "ExternalId_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkMeta" ADD CONSTRAINT "WorkMeta_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ListWork" ADD CONSTRAINT "ListWork_listId_fkey" FOREIGN KEY ("listId") REFERENCES "public"."List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ListWork" ADD CONSTRAINT "ListWork_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
