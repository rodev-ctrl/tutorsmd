/*
  Warnings:

  - You are about to drop the column `createdAt` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedBy` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `tutorId` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `email_changes` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `email_changes` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `email_changes` table. All the data in the column will be lost.
  - You are about to drop the column `newEmail` on the `email_changes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `email_changes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `lesson_client_notes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lesson_client_notes` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `lesson_client_notes` table. All the data in the column will be lost.
  - You are about to drop the column `selfRating` on the `lesson_client_notes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `lesson_client_notes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `materialType` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedByClient` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedByTutor` on the `lesson_materials` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lesson_tutor_reports` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `lesson_tutor_reports` table. All the data in the column will be lost.
  - You are about to drop the column `progressOfClass` on the `lesson_tutor_reports` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedToLearn` on the `lesson_tutor_reports` table. All the data in the column will be lost.
  - You are about to drop the column `tutorId` on the `lesson_tutor_reports` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `lesson_tutor_reports` table. All the data in the column will be lost.
  - You are about to drop the column `cancellationReason` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `durationMinutes` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `recurringScheduleId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `rescheduledFromId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `tutorId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `lessons` table. All the data in the column will be lost.
  - The `status` column on the `lessons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `oauth_providers` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `oauth_providers` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `oauth_providers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `deviceInfo` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `tutorId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `reviews` table. All the data in the column will be lost.
  - You are about to alter the column `rating` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `approvalStatus` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `fulldescribeDe` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `fulldescribeRu` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `highlightDe` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `highlightRu` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `ratingAvg` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `ratingCount` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `languageCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `available_slots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quizzes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regular_schedules` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `email_changes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[new_email]` on the table `email_changes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[link_hash]` on the table `email_changes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `email_verifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[link_hash]` on the table `email_verifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lesson_id]` on the table `lesson_client_notes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lesson_id]` on the table `lesson_tutor_reports` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider,provider_id]` on the table `oauth_providers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `password_resets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[link_hash]` on the table `password_resets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_hash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[client_id,tutor_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `tutors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,role]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_id` to the `appeals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `email_changes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link_hash` to the `email_changes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_email` to the `email_changes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `email_changes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `email_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link_hash` to the `email_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `email_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `feedbacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_id` to the `lesson_client_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_id` to the `lesson_client_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `lesson_client_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_name` to the `lesson_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_url` to the `lesson_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_id` to the `lesson_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `material_type` to the `lesson_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `lesson_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_id` to the `lesson_tutor_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tutor_id` to the `lesson_tutor_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `lesson_tutor_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_id` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduled_at` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tutor_id` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `lessons` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `provider_id` to the `oauth_providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `oauth_providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `password_resets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link_hash` to the `password_resets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `password_resets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tutor_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tutors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `tutors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "lesson_status" AS ENUM ('pending', 'pending_reschedule', 'confirmed', 'in_progress', 'completed', 'cancelled_by_client', 'cancelled_by_tutor', 'rescheduled', 'no_show_client', 'no_show_tutor');

-- CreateEnum
CREATE TYPE "lesson_type" AS ENUM ('trial', 'regular');

-- CreateEnum
CREATE TYPE "material_type" AS ENUM ('homework', 'homework_done', 'lesson_file', 'other');

-- CreateEnum
CREATE TYPE "cancelled_by_role" AS ENUM ('client', 'tutor');

-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('free_text', 'single_choice', 'multiple_choice');

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_userId_fkey";

-- DropForeignKey
ALTER TABLE "appeals" DROP CONSTRAINT "appeals_clientId_fkey";

-- DropForeignKey
ALTER TABLE "appeals" DROP CONSTRAINT "appeals_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "appeals" DROP CONSTRAINT "appeals_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "available_slots" DROP CONSTRAINT "available_slots_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "email_changes" DROP CONSTRAINT "email_changes_userId_fkey";

-- DropForeignKey
ALTER TABLE "email_verifications" DROP CONSTRAINT "email_verifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_userId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_client_notes" DROP CONSTRAINT "lesson_client_notes_clientId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_client_notes" DROP CONSTRAINT "lesson_client_notes_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_materials" DROP CONSTRAINT "lesson_materials_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_materials" DROP CONSTRAINT "lesson_materials_uploadedByClient_fkey";

-- DropForeignKey
ALTER TABLE "lesson_materials" DROP CONSTRAINT "lesson_materials_uploadedByTutor_fkey";

-- DropForeignKey
ALTER TABLE "lesson_tutor_reports" DROP CONSTRAINT "lesson_tutor_reports_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_tutor_reports" DROP CONSTRAINT "lesson_tutor_reports_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_clientId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_recurringScheduleId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_rescheduledFromId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_providers" DROP CONSTRAINT "oauth_providers_userId_fkey";

-- DropForeignKey
ALTER TABLE "password_resets" DROP CONSTRAINT "password_resets_userId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_answers" DROP CONSTRAINT "quiz_answers_clientId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_answers" DROP CONSTRAINT "quiz_answers_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_answers" DROP CONSTRAINT "quiz_answers_questionId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "regular_schedules" DROP CONSTRAINT "regular_schedules_clientId_fkey";

-- DropForeignKey
ALTER TABLE "regular_schedules" DROP CONSTRAINT "regular_schedules_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "regular_schedules" DROP CONSTRAINT "regular_schedules_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_clientId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "tutors" DROP CONSTRAINT "tutors_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_userId_fkey";

-- DropIndex
DROP INDEX "admins_userId_key";

-- DropIndex
DROP INDEX "clients_userId_key";

-- DropIndex
DROP INDEX "email_changes_link_key";

-- DropIndex
DROP INDEX "email_changes_newEmail_key";

-- DropIndex
DROP INDEX "email_changes_userId_key";

-- DropIndex
DROP INDEX "email_verifications_link_key";

-- DropIndex
DROP INDEX "email_verifications_userId_key";

-- DropIndex
DROP INDEX "lesson_client_notes_lessonId_key";

-- DropIndex
DROP INDEX "lesson_tutor_reports_lessonId_key";

-- DropIndex
DROP INDEX "oauth_providers_provider_providerId_key";

-- DropIndex
DROP INDEX "password_resets_link_key";

-- DropIndex
DROP INDEX "password_resets_userId_key";

-- DropIndex
DROP INDEX "refresh_tokens_tokenHash_key";

-- DropIndex
DROP INDEX "reviews_lessonId_clientId_key";

-- DropIndex
DROP INDEX "tutors_userId_key";

-- DropIndex
DROP INDEX "user_roles_userId_role_key";

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "appeals" DROP COLUMN "clientId",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "lessonId",
DROP COLUMN "resolvedAt",
DROP COLUMN "resolvedBy",
DROP COLUMN "tutorId",
ADD COLUMN     "client_id" UUID,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMPTZ,
ADD COLUMN     "lesson_id" UUID NOT NULL,
ADD COLUMN     "resolved_at" TIMESTAMPTZ,
ADD COLUMN     "resolved_by" UUID,
ADD COLUMN     "tutor_id" UUID;

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "avatarUrl",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "email_changes" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "link",
DROP COLUMN "newEmail",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "link_hash" TEXT NOT NULL,
ADD COLUMN     "new_email" VARCHAR(255) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "email_verifications" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "link",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "link_hash" TEXT NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "lesson_client_notes" DROP COLUMN "clientId",
DROP COLUMN "createdAt",
DROP COLUMN "lessonId",
DROP COLUMN "selfRating",
DROP COLUMN "updatedAt",
ADD COLUMN     "client_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lesson_id" UUID NOT NULL,
ADD COLUMN     "self_rating" SMALLINT,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "lesson_materials" DROP COLUMN "createdAt",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "fileUrl",
DROP COLUMN "lessonId",
DROP COLUMN "materialType",
DROP COLUMN "mimeType",
DROP COLUMN "updatedAt",
DROP COLUMN "uploadedByClient",
DROP COLUMN "uploadedByTutor",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "file_size" BIGINT,
ADD COLUMN     "file_url" TEXT NOT NULL,
ADD COLUMN     "lesson_id" UUID NOT NULL,
ADD COLUMN     "material_type" "material_type" NOT NULL,
ADD COLUMN     "mime_type" VARCHAR(100),
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "uploaded_by_client" UUID,
ADD COLUMN     "uploaded_by_tutor" UUID;

-- AlterTable
ALTER TABLE "lesson_tutor_reports" DROP COLUMN "createdAt",
DROP COLUMN "lessonId",
DROP COLUMN "progressOfClass",
DROP COLUMN "recommendedToLearn",
DROP COLUMN "tutorId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lesson_id" UUID NOT NULL,
ADD COLUMN     "progress_of_class" TEXT,
ADD COLUMN     "recommended_to_learn" TEXT,
ADD COLUMN     "tutor_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "cancellationReason",
DROP COLUMN "clientId",
DROP COLUMN "completedAt",
DROP COLUMN "createdAt",
DROP COLUMN "durationMinutes",
DROP COLUMN "recurringScheduleId",
DROP COLUMN "rescheduledFromId",
DROP COLUMN "roomId",
DROP COLUMN "scheduledAt",
DROP COLUMN "startedAt",
DROP COLUMN "subjectId",
DROP COLUMN "tutorId",
DROP COLUMN "updatedAt",
ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "client_id" UUID NOT NULL,
ADD COLUMN     "completed_at" TIMESTAMPTZ,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "duration_minutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "proposed_expires_at" TIMESTAMPTZ,
ADD COLUMN     "proposed_scheduled_at" TIMESTAMPTZ,
ADD COLUMN     "recurring_schedule_id" UUID,
ADD COLUMN     "rescheduled_from_id" UUID,
ADD COLUMN     "room_id" VARCHAR(255),
ADD COLUMN     "scheduled_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "started_at" TIMESTAMPTZ,
ADD COLUMN     "subject_id" UUID NOT NULL,
ADD COLUMN     "tutor_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "lesson_type" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "lesson_status" NOT NULL DEFAULT 'confirmed';

-- AlterTable
ALTER TABLE "oauth_providers" DROP COLUMN "createdAt",
DROP COLUMN "providerId",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider_id" VARCHAR(255) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "password_resets" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "link",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "link_hash" VARCHAR(64) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "createdAt",
DROP COLUMN "deviceInfo",
DROP COLUMN "expiresAt",
DROP COLUMN "revokedAt",
DROP COLUMN "tokenHash",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device_info" VARCHAR(255),
ADD COLUMN     "expires_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "revoked_at" TIMESTAMPTZ,
ADD COLUMN     "token_hash" VARCHAR(255) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "clientId",
DROP COLUMN "createdAt",
DROP COLUMN "lessonId",
DROP COLUMN "tutorId",
DROP COLUMN "updatedAt",
ADD COLUMN     "client_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lesson_id" UUID NOT NULL,
ADD COLUMN     "tutor_id" UUID NOT NULL,
ADD COLUMN     "tutor_responded_at" TIMESTAMPTZ,
ADD COLUMN     "tutor_response" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ALTER COLUMN "rating" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "tutors" DROP COLUMN "approvalStatus",
DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
DROP COLUMN "avatarUrl",
DROP COLUMN "createdAt",
DROP COLUMN "fulldescribeDe",
DROP COLUMN "fulldescribeRu",
DROP COLUMN "highlightDe",
DROP COLUMN "highlightRu",
DROP COLUMN "hourlyRate",
DROP COLUMN "ratingAvg",
DROP COLUMN "ratingCount",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "approval_status" "approval_status" NOT NULL DEFAULT 'pending',
ADD COLUMN     "approved_at" TIMESTAMPTZ,
ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fulldescribe_de" TEXT,
ADD COLUMN     "fulldescribe_ru" TEXT,
ADD COLUMN     "highlight_de" TEXT,
ADD COLUMN     "highlight_ru" TEXT,
ADD COLUMN     "hourly_rate" DECIMAL(10,2),
ADD COLUMN     "name_de" VARCHAR(100),
ADD COLUMN     "name_ru" VARCHAR(100),
ADD COLUMN     "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "surname_de" VARCHAR(100),
ADD COLUMN     "surname_ru" VARCHAR(100),
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "user_roles" DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "isEmailVerified",
DROP COLUMN "languageCode",
DROP COLUMN "passwordHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language_code" VARCHAR(10) NOT NULL DEFAULT 'ru',
ADD COLUMN     "password_hash" VARCHAR(255),
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- DropTable
DROP TABLE "available_slots";

-- DropTable
DROP TABLE "quiz_answers";

-- DropTable
DROP TABLE "quiz_questions";

-- DropTable
DROP TABLE "quizzes";

-- DropTable
DROP TABLE "regular_schedules";

-- DropEnum
DROP TYPE "ApprovalStatus";

-- DropEnum
DROP TYPE "CancelledByRole";

-- DropEnum
DROP TYPE "LessonStatus";

-- DropEnum
DROP TYPE "LessonType";

-- DropEnum
DROP TYPE "MaterialType";

-- CreateTable
CREATE TABLE "available_slot" (
    "id" UUID NOT NULL,
    "tutor_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "available_slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regular_schedule" (
    "id" UUID NOT NULL,
    "tutor_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "time_of_day" TIMETZ NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cancelled_at" TIMESTAMPTZ,
    "cancelled_by" "cancelled_by_role",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "regular_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz" (
    "id" UUID NOT NULL,
    "tutor_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_question" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "type" "question_type" NOT NULL DEFAULT 'free_text',
    "order" INTEGER NOT NULL,
    "max_points" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quiz_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_option" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_quiz" (
    "lesson_id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_quiz_pkey" PRIMARY KEY ("lesson_id","quiz_id")
);

-- CreateTable
CREATE TABLE "quiz_answer" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "answer" TEXT,
    "earned_points" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quiz_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answer_option" (
    "answer_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,

    CONSTRAINT "quiz_answer_option_pkey" PRIMARY KEY ("answer_id","option_id")
);

-- CreateTable
CREATE TABLE "quiz_answer_feedback" (
    "id" UUID NOT NULL,
    "answer_id" UUID NOT NULL,
    "tutor_id" UUID NOT NULL,
    "comment" TEXT,
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quiz_answer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempt" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "lesson_id" UUID,
    "client_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "total_points" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quiz_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_chats" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderRole" VARCHAR(20) NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_attachments" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "available_slot_tutor_id_is_active_idx" ON "available_slot"("tutor_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "available_slot_tutor_id_day_of_week_start_time_key" ON "available_slot"("tutor_id", "day_of_week", "start_time");

-- CreateIndex
CREATE INDEX "regular_schedule_tutor_id_is_active_idx" ON "regular_schedule"("tutor_id", "is_active");

-- CreateIndex
CREATE INDEX "regular_schedule_client_id_is_active_idx" ON "regular_schedule"("client_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "regular_schedule_client_id_tutor_id_day_of_week_time_of_day_key" ON "regular_schedule"("client_id", "tutor_id", "day_of_week", "time_of_day");

-- CreateIndex
CREATE INDEX "quiz_tutor_id_idx" ON "quiz"("tutor_id");

-- CreateIndex
CREATE INDEX "quiz_subject_id_idx" ON "quiz"("subject_id");

-- CreateIndex
CREATE INDEX "quiz_question_quiz_id_idx" ON "quiz_question"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_question_quiz_id_order_key" ON "quiz_question"("quiz_id", "order");

-- CreateIndex
CREATE INDEX "quiz_option_question_id_idx" ON "quiz_option"("question_id");

-- CreateIndex
CREATE INDEX "lesson_quiz_quiz_id_idx" ON "lesson_quiz"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_answer_attempt_id_idx" ON "quiz_answer"("attempt_id");

-- CreateIndex
CREATE INDEX "quiz_answer_question_id_idx" ON "quiz_answer"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_answer_question_id_attempt_id_key" ON "quiz_answer"("question_id", "attempt_id");

-- CreateIndex
CREATE INDEX "quiz_answer_option_option_id_idx" ON "quiz_answer_option"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_answer_feedback_answer_id_key" ON "quiz_answer_feedback"("answer_id");

-- CreateIndex
CREATE INDEX "quiz_answer_feedback_tutor_id_idx" ON "quiz_answer_feedback"("tutor_id");

-- CreateIndex
CREATE INDEX "quiz_attempt_quiz_id_idx" ON "quiz_attempt"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempt_lesson_id_idx" ON "quiz_attempt"("lesson_id");

-- CreateIndex
CREATE INDEX "quiz_attempt_client_id_idx" ON "quiz_attempt"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_chats_userId_key" ON "support_chats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");

-- CreateIndex
CREATE INDEX "appeals_lesson_id_idx" ON "appeals"("lesson_id");

-- CreateIndex
CREATE INDEX "appeals_client_id_idx" ON "appeals"("client_id");

-- CreateIndex
CREATE INDEX "appeals_tutor_id_idx" ON "appeals"("tutor_id");

-- CreateIndex
CREATE INDEX "appeals_status_idx" ON "appeals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "clients_user_id_key" ON "clients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_changes_user_id_key" ON "email_changes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_changes_new_email_key" ON "email_changes"("new_email");

-- CreateIndex
CREATE UNIQUE INDEX "email_changes_link_hash_key" ON "email_changes"("link_hash");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_user_id_key" ON "email_verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_link_hash_key" ON "email_verifications"("link_hash");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_client_notes_lesson_id_key" ON "lesson_client_notes"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_client_notes_client_id_idx" ON "lesson_client_notes"("client_id");

-- CreateIndex
CREATE INDEX "lesson_materials_lesson_id_idx" ON "lesson_materials"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_tutor_reports_lesson_id_key" ON "lesson_tutor_reports"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_tutor_reports_tutor_id_idx" ON "lesson_tutor_reports"("tutor_id");

-- CreateIndex
CREATE INDEX "lessons_client_id_tutor_id_type_idx" ON "lessons"("client_id", "tutor_id", "type");

-- CreateIndex
CREATE INDEX "lessons_tutor_id_status_scheduled_at_idx" ON "lessons"("tutor_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "lessons_client_id_status_idx" ON "lessons"("client_id", "status");

-- CreateIndex
CREATE INDEX "lessons_recurring_schedule_id_idx" ON "lessons"("recurring_schedule_id");

-- CreateIndex
CREATE INDEX "lessons_scheduled_at_idx" ON "lessons"("scheduled_at");

-- CreateIndex
CREATE INDEX "oauth_providers_user_id_idx" ON "oauth_providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_providers_provider_provider_id_key" ON "oauth_providers"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_user_id_key" ON "password_resets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_link_hash_key" ON "password_resets"("link_hash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "reviews_tutor_id_rating_idx" ON "reviews"("tutor_id", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_client_id_tutor_id_key" ON "reviews"("client_id", "tutor_id");

-- CreateIndex
CREATE UNIQUE INDEX "tutors_user_id_key" ON "tutors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_providers" ADD CONSTRAINT "oauth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_changes" ADD CONSTRAINT "email_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "available_slot" ADD CONSTRAINT "available_slot_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_schedule" ADD CONSTRAINT "regular_schedule_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_schedule" ADD CONSTRAINT "regular_schedule_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_schedule" ADD CONSTRAINT "regular_schedule_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_rescheduled_from_id_fkey" FOREIGN KEY ("rescheduled_from_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_recurring_schedule_id_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "regular_schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_materials" ADD CONSTRAINT "lesson_materials_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_materials" ADD CONSTRAINT "lesson_materials_uploaded_by_tutor_fkey" FOREIGN KEY ("uploaded_by_tutor") REFERENCES "tutors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_materials" ADD CONSTRAINT "lesson_materials_uploaded_by_client_fkey" FOREIGN KEY ("uploaded_by_client") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tutor_reports" ADD CONSTRAINT "lesson_tutor_reports_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tutor_reports" ADD CONSTRAINT "lesson_tutor_reports_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_client_notes" ADD CONSTRAINT "lesson_client_notes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_client_notes" ADD CONSTRAINT "lesson_client_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutors" ADD CONSTRAINT "tutors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_option" ADD CONSTRAINT "quiz_option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_quiz" ADD CONSTRAINT "lesson_quiz_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_quiz" ADD CONSTRAINT "lesson_quiz_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answer" ADD CONSTRAINT "quiz_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answer" ADD CONSTRAINT "quiz_answer_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answer_option" ADD CONSTRAINT "quiz_answer_option_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "quiz_answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answer_option" ADD CONSTRAINT "quiz_answer_option_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "quiz_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answer_feedback" ADD CONSTRAINT "quiz_answer_feedback_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "quiz_answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answer_feedback" ADD CONSTRAINT "quiz_answer_feedback_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_chats" ADD CONSTRAINT "support_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "support_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "support_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
