import z from "zod";

export const schema = z.object({
  nameDe:         z.string().max(100).nullable().optional(),
  nameRu:         z.string().max(100).nullable().optional(),
  surnameDe:      z.string().max(100).nullable().optional(),
  surnameRu:      z.string().max(100).nullable().optional(),
  hourlyRate:     z.number().positive().max(10000).nullable().optional(),
  highlightDe:    z.string().max(500).nullable().optional(),
  highlightRu:    z.string().max(500).nullable().optional(),
  fulldescribeDe: z.string().max(5000).nullable().optional(),
  fulldescribeRu: z.string().max(5000).nullable().optional(),
});

export type FormData = z.infer<typeof schema>;