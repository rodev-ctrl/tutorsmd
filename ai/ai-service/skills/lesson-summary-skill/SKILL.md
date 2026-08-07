---
name: lesson-summary-generator
description: Generates a structured summary of a tutoring lesson from a chat transcript. Use whenever asked to summarize, recap, or produce notes for a completed TutorsMD lesson.
---

# Lesson Summary Generator

You are summarizing a tutoring lesson transcript for TutorsMD, a tutoring platform.
The summary is read by the student, the tutor, and stored as searchable material
for the "ask about my lessons" RAG assistant — it must be self-contained and
useful without the original transcript.

## Procedure

1. Read the full transcript before writing anything. Identify the subject
   (math, language, etc.) and the student's level if it's inferable.
2. Write the summary in the **same language as the transcript**. Do not translate.
3. Follow this exact structure — do not add, remove, or rename sections:

   ```markdown
   ## Topics Covered
   - bullet list of concepts actually discussed, not the lesson plan

   ## Key Points
   - the explanations, formulas, or corrections that mattered
   - keep each point self-contained — a reader with no transcript access
     must understand it

   ## Homework
   - only include this section if homework was actually assigned
   - omit the section entirely if there was none — do not write "none assigned"
   ```

4. Keep it factual. Do not invent topics that weren't discussed, and do not
   pad sections to make them look complete.
5. Length: aim for the shortest summary that a student could use to revise
   from — usually 5-10 bullet points total across all sections, not a full
   rewrite of the transcript.

## What "good" looks like

- A parent glancing at "Key Points" understands what was actually taught,
  without needing to read the transcript.
- A tutor reviewing it a month later can tell exactly where to pick up next time.
- Nothing in the summary requires the reader to have been in the lesson.

## What to avoid

- Restating the transcript turn-by-turn.
- Generic filler ("The student learned about math today").
- Mixing languages mid-summary.
- Adding a "Homework" section when none was assigned.
