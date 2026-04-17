import canvasState from "../../../../store/canvasState";
import Tool from "./Tool";

export default class Eraser extends Tool {
  points: { x: number; y: number }[] = []; // Храним координаты стирания
  pageId: number = 0;

  constructor(canvas: HTMLCanvasElement, pageId: number) {
    super(canvas);
    this.pageId = pageId;
    this.listen();
    this.applyEraserSettings();
  }

  listen() {
    this.canvas.onmousedown = this.mouseDownHandler.bind(this);
    this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.canvas.onmouseup = this.mouseUpHandler.bind(this);
  }

  private applyEraserSettings() {
    this.strokeColor = "white";
    this.ctx.strokeStyle = "white";
    this.lineWidth = 40;
  }

  // Нажал на мышку
  // Локальное сохранение в "this.points"
  mouseDownHandler(event: MouseEvent) {
    this.mouseDown = true;
    this.applyEraserSettings();
    this.points = []; // Начинаю новую операцию стирания

    // вызывает saveState("brush"). В Brush.mouseDownHandler — есть saveState
    // super.mouseDownHandler(event);
    // Но это не нужно, так как в историю запишется будто было действие 
    // "brush", а не "eraser" -> а нужно "eraser"

    this.applyEraserSettings();

    this.ctx.beginPath();
    this.ctx.moveTo(event.offsetX, event.offsetY);
    
    
    this.points.push({ x: event.offsetX, y: event.offsetY });
  }

  // Двигает мышкой
  // Локальное сохранение в "this.points"
  mouseMoveHandler(event: MouseEvent) {
    if (!this.mouseDown) return;
    this.applyEraserSettings();

    const prev = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = "destination-out";
    // super.mouseMoveHandler(event);

    this.ctx.lineTo(event.offsetX, event.offsetY);
    this.ctx.stroke();

    this.ctx.globalCompositeOperation = prev;

    this.points.push({ x: event.offsetX, y: event.offsetY });
  }

  // Отпустил мышку
  // Глобальное сохранение в "canvasState" 
  mouseUpHandler() {
    this.mouseDown = false;

    if (this.points.length > 0) {
      
      const eraserData = {
        points: this.points,
        lineWidth: this.lineWidth
      }
      canvasState.saveState("erase", eraserData, this.pageId);
      console.log("🧹 Eraser сохранено:", eraserData);
    }

    // BRUSH - сое состояние, ERASER - свое состояние
    // super.mouseUpHandler();
  }

  // !!!!!!!!!!!!!!!!!!!!!!!!!!!
  // Эта строка наследует метод рисования от Brush
  // super.mouseDownHandler(event);
  // У меня ж Erase - это Brush, который рисует только белым. ТОЧНО!!
  // !!!!!!!!!!!!!!!!!!!!!!

  /*
  draw(x: number, y: number) {
    this.applyEraserSettings();
    const previousComposite = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = "destination-out"; // Стирание
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.globalCompositeOperation = previousComposite;
  }
    */
}
