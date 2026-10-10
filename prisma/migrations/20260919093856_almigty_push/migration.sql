/*
  Warnings:

  - A unique constraint covering the columns `[lectureId,slideNumber]` on the table `Slide` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `semester` to the `Lecture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic` to the `Lecture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Lecture` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "semester" INTEGER NOT NULL,
ADD COLUMN     "topic" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "LectureInsight" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "slideIds" TEXT[],
    "insight" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LectureInsight_lectureId_key" ON "LectureInsight"("lectureId");

-- CreateIndex
CREATE UNIQUE INDEX "Slide_lectureId_slideNumber_key" ON "Slide"("lectureId", "slideNumber");
