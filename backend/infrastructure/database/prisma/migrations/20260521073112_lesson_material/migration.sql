-- CreateTable
CREATE TABLE "lesson_messages" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "sender_role" VARCHAR(20) NOT NULL,
    "text" TEXT,
    "file_key" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_messages_lesson_id_created_at_idx" ON "lesson_messages"("lesson_id", "created_at");

-- AddForeignKey
ALTER TABLE "lesson_messages" ADD CONSTRAINT "lesson_messages_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_messages" ADD CONSTRAINT "lesson_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
