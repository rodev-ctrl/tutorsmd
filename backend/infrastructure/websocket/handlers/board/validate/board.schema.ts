import { z } from "zod";

const coord = z.number().finite().min(-10_000).max(10_000);
const color = z.string().max(50).regex(
  /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\))$/,
  "Invalid color format",
);
const lineWidth = z.number().finite().positive().max(100);

// points как объекты {x, y} — именно так шлёт клиент
const point = z.object({ x: coord, y: coord });
const points = z.array(point).min(1).max(1_000);

const r2Key = z.string().min(1).max(500)
  .regex(/^[a-zA-Z0-9_\-/.]+$/, "Invalid R2 key format")
  .refine((k) => !k.includes(".."), "Path traversal is not allowed");

// brush — клиент шлёт lineWidth
const brushData = z.object({
  points,
  color,
  lineWidth,
  opacity: z.number().min(0).max(1).optional(),
});

// erase — клиент шлёт lineWidth
const eraseData = z.object({
  points,
  lineWidth,
});

// line
const lineData = z.object({
  x1: coord, y1: coord,
  x2: coord, y2: coord,
  color,
  lineWidth,
  opacity: z.number().min(0).max(1).optional(),
});

// rect — клиент шлёт {x, y, width, height}, width/height могут быть отрицательными
const rectData = z.object({
  x: coord, y: coord,
  width:  z.number().finite().min(-10_000).max(10_000),
  height: z.number().finite().min(-10_000).max(10_000),
  color,
  lineWidth,
  opacity: z.number().min(0).max(1).optional(),
});

// circle — клиент шлёт {x, y, width, height} (не cx/cy/rx/ry)
const circleData = z.object({
  x: coord, y: coord,
  width:  z.number().finite().min(-10_000).max(10_000),
  height: z.number().finite().min(-10_000).max(10_000),
  color,
  lineWidth,
  opacity: z.number().min(0).max(1).optional(),
});

// text — клиент шлёт {text, x, y, color, fontSize}
const textData = z.object({
  x: coord,
  y: coord,
  text:     z.string().min(1).max(500).trim(),  // ← было content
  fontSize: z.number().int().positive().max(200),
  color,
  fontFamily: z.enum(["sans-serif", "serif", "monospace"]).optional(),
  bold:   z.boolean().optional(),
  italic: z.boolean().optional(),
});

// image
const imageData = z.object({
  fileKey: r2Key,
  x: coord, y: coord,
  width:  z.number().finite().positive().max(10_000),
  height: z.number().finite().positive().max(10_000),
});

export const boardActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("brush"),  data: brushData  }),
  z.object({ type: z.literal("line"),   data: lineData   }),
  z.object({ type: z.literal("rect"),   data: rectData   }),
  z.object({ type: z.literal("circle"), data: circleData }),
  z.object({ type: z.literal("text"),   data: textData   }),
  z.object({ type: z.literal("erase"),  data: eraseData  }),
  z.object({ type: z.literal("image"),  data: imageData  }),
]);

export type ValidatedActionPayload = z.infer<typeof boardActionSchema>;
export type ValidatedBoardAction   = z.infer<typeof boardActionSchema>;
export type BoardActionType        = ValidatedBoardAction["type"];

const baseSchema = z.object({
  lessonId:  z.string().uuid("lessonId must be UUID"),
  pageIndex: z.number().int().nonnegative(),
  type:      z.enum(["brush", "line", "rect", "circle", "text", "erase", "image"]),
  data:      z.unknown(),
});

export type ParseResult =
  | { success: true;  lessonId: string; pageIndex: number; action: ValidatedBoardAction }
  | { success: false; error: string };

export const parseIncomingAction = (raw: unknown): ParseResult => {

    // Разворачиваю action на верхний уровень перед валидацией
  const unwrapped = (() => {
    if (
      raw &&
      typeof raw === 'object' &&
      'action' in raw &&
      raw.action &&
      typeof raw.action === 'object'
    ) {
      const { action, ...rest } = raw as any;
      return { ...rest, type: action.type, data: action.data };
    }
    return raw;
  })();

  const base = baseSchema.safeParse(unwrapped);
  if (!base.success) {
    return { success: false, error: base.error.issues[0]?.message ?? "Invalid structure" };
  }

  const payload = boardActionSchema.safeParse({
    type: base.data.type,
    data: base.data.data,
  });

  if (!payload.success) {
    return { success: false, error: payload.error.issues[0]?.message ?? "Invalid action data" };
  }

  return {
    success:   true,
    lessonId:  base.data.lessonId,
    pageIndex: base.data.pageIndex,
    action:    payload.data,
  };
};