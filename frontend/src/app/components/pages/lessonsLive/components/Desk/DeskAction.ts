export type DeskAction = {
  lessonId: string;
  pageIndex: number;
  email: string;

  type: "brush" | "line" | "rect" | "circle" | "text" | "erase";
  data: any;              // твой объект с цветом, линиями, точками
  timestamp: number;
};

  