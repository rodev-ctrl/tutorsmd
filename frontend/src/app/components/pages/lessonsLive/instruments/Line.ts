import toolState from "../../../../store/toolState";
import canvasState from "../../../../store/canvasState";
import Tool from "./Tool";

export default class Line extends Tool {
    private startX: number = 0;
    private startY: number = 0;
    private saved: ImageData | null = null;
    name: string;
    canvasRef: HTMLCanvasElement | null = null;
    pageId: number = 0;

    constructor(canvas: HTMLCanvasElement, pageId: number) {
        super(canvas);
        this.canvasRef = canvas;
        this.pageId = pageId;
        this.listen();
        this.name = "Line";
    }

    protected listen() {
        this.canvas.onmousedown = this.mouseDownHandler.bind(this);
        this.canvas.onmouseup = this.mouseUpHandler.bind(this);
        this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
    }

    // Нажал на мышку
    // Локальное сохранение в "this.points"
    private mouseDownHandler(e: MouseEvent) {
        this.mouseDown = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        // Сохраняем текущее состояние canvas
        if (this.ctx) {
            this.saved = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Двигает мышкой
    // Локальное сохранение в "this.points"
    private mouseMoveHandler(e: MouseEvent) {
        if (!this.mouseDown || !this.saved) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Восстанавливаем предыдущий холст
        this.ctx.putImageData(this.saved, 0, 0);

        // Рисуем новую линию
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = toolState.lineWidth;
        this.lineWidth = toolState.lineWidth;

        this.ctx.stroke();
    }

    // Отпустил мышку
    // Глобальное сохранение в "canvasState" 
    private mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;

        const rect = this.canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const lineData = {
            startX: this.startX,
            startY: this.startY,
            endX: endX,
            endY: endY,
            color: this.currentColor,
            lineWidth: toolState.lineWidth
        };

        if (this.canvas) {
            canvasState.saveState("line", lineData, this.pageId);
            console.log("📏 Линия сохранена в истории", lineData);
        }
    }
}
