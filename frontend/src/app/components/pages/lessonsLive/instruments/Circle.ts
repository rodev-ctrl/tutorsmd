



import canvasState from "../../../../store/canvasState";
import Tool from "./Tool";


export default class Circle extends Tool {
    private startX: number = 0;
    private startY: number = 0;
    private saved: string = "";
    canvasRef: HTMLCanvasElement | null = null; // Изменяем тип = null;
    pageId: number = 0;



    constructor(canvas:HTMLCanvasElement, pageId: number) {
        super(canvas);

        if(this.canvasRef && "current" in this.canvasRef && this.canvasRef.current && this.canvasRef.current as HTMLCanvasElement) {
            this.canvasRef = canvas;
            }
            this.pageId = pageId
        
        this.listen()
    }

    protected listen() {
        this.canvas.onmousemove = this.mouseMoveHandler.bind(this)
        this.canvas.onmousedown = this.mouseDownHandler.bind(this)
        this.canvas.onmouseup = this.mouseUpHandler.bind(this)
    }

    public updateColor(color: string): void {
        this.currentColor = color;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
    }

    // Нажал на мышку
    // Локальное сохранение в "this.points"
    mouseDownHandler(e: MouseEvent) {
        if (e.target instanceof HTMLElement) {
            this.mouseDown = true;
            const rect = this.canvas.getBoundingClientRect();
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
            console.log("🟢 Начало рисования круга", { x: this.startX, y: this.startY });
        }
    }
    
    // Двигает мышкой
    // Локальное сохранение в "this.points"
    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && e.target instanceof HTMLElement) {
            const rect = this.canvas.getBoundingClientRect();
            let currentX = e.clientX - rect.left;
            let currentY = e.clientY - rect.top;
            let width = currentX - this.startX;
            let height = currentY - this.startY;
            let r = Math.sqrt(width * width + height * height);
            this.draw(this.startX, this.startY, r);
        }
    }
    
    // Отпустил мышку
    // Глобальное сохранение в "canvasState" 
    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
    
        // Вычисляем координаты и радиус
        const rect = this.canvas.getBoundingClientRect();
        let currentX = e.clientX - rect.left;
        let currentY = e.clientY - rect.top;
        let width = currentX - this.startX;
        let height = currentY - this.startY;
        let r = Math.sqrt(width * width + height * height);
    
        const circleData = {
            x: this.startX,
            y: this.startY,
            r: r,
            color: this.currentColor
        };
    
        if (this.canvas) {
            canvasState.saveState("circle", circleData, this.pageId);
            console.log("⭕ Круг сохранен в истории", circleData);
        }
    }
    
    
    draw(x: number, y: number, r: number) {
        console.log("🎨 Рисуем круг", { x, y, r, color: this.currentColor });
    
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.currentColor;
        this.ctx.fill();
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.stroke();
    }
    
    
    
}