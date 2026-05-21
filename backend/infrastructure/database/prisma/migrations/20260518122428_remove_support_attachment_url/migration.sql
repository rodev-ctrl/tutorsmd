/*
  Warnings:

  - You are about to drop the column `url` on the `support_attachments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "quiz" DROP CONSTRAINT "quiz_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz" DROP CONSTRAINT "quiz_tutor_id_fkey";

-- AlterTable
ALTER TABLE "quiz" ALTER COLUMN "tutor_id" DROP NOT NULL,
ALTER COLUMN "subject_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "support_attachments" DROP COLUMN "url";

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
