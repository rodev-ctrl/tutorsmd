import canvasState from "../../../../store/canvasState";
import toolState from "../../../../store/toolState";
import Tool from "./Tool";

export default class Brush extends Tool {
  canvasRef: HTMLCanvasElement | null = null;
  pageId: number = 0;
  points: { x: number; y: number }[] = []; // Храним точки линии

  constructor(canvas: HTMLCanvasElement, pageId: number) {
    super(canvas);
    console.log("Brush создан! Добавляем обработчики...");
    this.canvasRef = canvas;
    this.pageId = pageId;
    this.listen();
  }

  listen() {
    console.log("Brush: Вешаем обработчики событий!");
    this.canvas.onmousedown = this.mouseDownHandler.bind(this);
    this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.canvas.onmouseup = this.mouseUpHandler.bind(this);
  }

  // Нажал на мышку
  // Локальное сохранение в "this.points"
  mouseDownHandler(event: MouseEvent) {
    this.mouseDown = true;
    this.points = []; // Начинаем новую линию
    console.log("Brush: mouseDown =", this.mouseDown);

    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = toolState.lineWidth;
    this.lineWidth = toolState.lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(event.offsetX, event.offsetY);
    this.ctx.lineTo(event.offsetX + 1, event.offsetY + 1);
    // this.ctx.stroke();
  
    this.points.push({ x: event.offsetX, y: event.offsetY });
  }

  // Двигает мышкой
  // Локальное сохранение в "this.points"
  mouseMoveHandler(event: MouseEvent) {
    if (!this.mouseDown) return;

    console.log("Brush: Рисуем в", event.offsetX, event.offsetY);
    this.ctx.lineTo(event.offsetX, event.offsetY);
    this.ctx.stroke();

    this.points.push({ x: event.offsetX, y: event.offsetY });
  }

  // Отпустил мышку
  // Глобальное сохранение в "canvasState" 
  mouseUpHandler() {
    this.mouseDown = false;
    if (this.points.length > 0) {
      const brushData = {
        points: this.points,
        color: this.fillColor,
        lineWidth: toolState.lineWidth
    };
      canvasState.saveState("brush", brushData, this.pageId);
      console.log("🖌 Brush сохранен", this.points);
    }
  }
}
