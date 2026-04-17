
export default class Tool {
	protected canvas: HTMLCanvasElement;
	public ctx: CanvasRenderingContext2D;
	protected mouseDown: boolean = false; // Сделать protected вместо private
	protected currentColor: string = '#000000'; // По умолчанию красный

		// Добавляем textElements как необязательное свойство
		textElements?: { content: string; x: number; y: number }[];

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const context = canvas.getContext("2d", { willReadFrequently: true });

		if (!context) {
			throw new Error("Не удалось получить контекст рисования 2D");
		}

		this.ctx = context;
		this.destroyEvents();
	}

	

	// Изменение цвета заливки
	set fillColor(color: string) {
		this.ctx.fillStyle = color;
	}

	get fillColor(): string {
		return this.ctx.fillStyle as string;
	}

	// Изменение цвета обводки
	set strokeColor(color: string) {
		this.currentColor = color;
		this.ctx.strokeStyle = color;
	}

	get strokeColor(): string {
		return this.ctx.strokeStyle as string;
	  }

	// Изменение толщины линии
	set lineWidth(width: number) {
		this.ctx.lineWidth = width;
	}

	get lineWidth(): number {
		return this.ctx.lineWidth;
	  }

	// Удаление слушателей событий при смене инструмента
	destroyEvents() {
		if (this.canvas) {
			this.canvas.onmousemove = null;
			this.canvas.onmousedown = null;
			this.canvas.onmouseup = null;
		}
	}

	public updateColor(color: string): void {
        this.currentColor = color;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
    }

}
