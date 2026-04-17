import canvasState from "../../../../store/canvasState";
import Tool from "./Tool";

export default class Rect extends Tool {
	private startX: number = 0;
	private startY: number = 0;
	private width: number = 0;
	private height: number = 0;
	private saved: ImageData | null = null;
	pageId: number = 0;

	constructor(canvas: HTMLCanvasElement, pageId: number) {
		super(canvas);
		this.pageId = pageId;
		this.listen();
	}

	protected listen(): void {
		this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
		this.canvas.onmousedown = this.mouseDownHandler.bind(this);
		this.canvas.onmouseup = this.mouseUpHandler.bind(this);
	}

	// Нажал на мышку
  	// Локальное сохранение в "this.points"
	private mouseDownHandler(e: MouseEvent): void {
		this.mouseDown = true;
		this.startX = e.offsetX;
		this.startY = e.offsetY;

		// Сохраняем текущее состояние холста
		if (this.ctx) {
			this.saved = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		}
	}

	// Двигает мышкой
  	// Локальное сохранение в "this.points"
	private mouseMoveHandler(e: MouseEvent): void {
		if (this.mouseDown && this.saved) {
			const currentX = e.offsetX;
			const currentY = e.offsetY;
			this.width = currentX - this.startX;
			this.height = currentY - this.startY;
			this.draw(this.startX, this.startY, this.width, this.height);
		}
	}

	// Отпустил мышку
  	// Глобальное сохранение в "canvasState" 
	private mouseUpHandler(): void {
		this.mouseDown = false;

		// Сохраняем параметры прямоугольника
		const rectData = {
			x: this.startX,
			y: this.startY,
			width: this.width,
			height: this.height,
			color: this.fillColor
		};

		canvasState.saveState("rect", rectData, this.pageId);
		console.log("📏 Прямоугольник сохранен в истории", rectData);
	}

	private draw(x: number, y: number, w: number, h: number): void {
		if (!this.saved) return;

		// Восстанавливаем предыдущее состояние холста
		this.ctx.putImageData(this.saved, 0, 0);

		// Рисуем прямоугольник
		this.ctx.beginPath();
		this.ctx.rect(x, y, w, h);
		this.ctx.fillStyle = this.fillColor;
		this.ctx.fill();
		this.ctx.stroke();
	}
}

