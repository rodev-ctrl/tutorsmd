import { makeAutoObservable } from "mobx";
import Tool from "../components/pages/lessonsLive/instruments/Tool";

class ToolState {
    tool: Tool | null = null;
    currentColor: string = "#000000"; // Установим дефолтный цвет
    ctx: CanvasRenderingContext2D | null = null;
    lineWidth: number = 10;


    constructor() {
        makeAutoObservable(this);
    }

    setTool(tool: Tool) {
        this.tool = tool;
        console.log("Установлен инструмент:", this.tool);
        // Обновляем контекст canvas
        if (this.tool) {
            this.ctx = this.tool.ctx;
            this.updateColor(this.currentColor);
        }
    }

    setFillColor(color: string) {
        if (this.tool) {
            this.tool.fillColor = color;
            this.currentColor = color;
        }
    }

    setStrokeColor(color: string) {
        if (this.tool) {
            this.tool.strokeColor = color;
            this.currentColor = color;
        }
    }

    setLineWidth(width: number) {
        this.lineWidth = width;

        if (this.tool) {
            this.tool.lineWidth = width;
            this.tool.ctx.lineWidth = width;
        }
    }

    public updateColor(color: string): void {
        this.currentColor = color;
        if (this.ctx) {
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = color;
        }
        if (this.tool) {
            this.tool.updateColor(color);
        }
    }
}

export default new ToolState();