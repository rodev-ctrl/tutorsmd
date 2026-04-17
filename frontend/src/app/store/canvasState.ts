/*
import TextTool from "../components/pages/lessonsLive/instruments/Text";

declare global {
    interface Window {
        textToolInstance?: TextTool;
    }
}

type HistoryAction =
    | { type: "text"; data: { content: string; x: number; y: number } }
    | { type: "draw"; data: string }; // imageData

class CanvasState {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    private history: Record<number, HistoryAction[]> = {};
    private redoStack: Record<number, HistoryAction[]> = {};

    public textElements: { content: string; x: number; y: number }[] = [];
    private activePage: number = 0;

    // 🎨 Настройки кисти
    public brushColor: string = "#000000"; // Чёрный цвет по умолчанию
    public brushSize: number = 5; // Толщина кисти по умолчанию

    private isDrawing: boolean = false;
    private lastSavedImage: string = ""; // Для хранения последнего изображения

    constructor(canvas: HTMLCanvasElement) {
        this.setCanvas(canvas, 1);
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
        this.startDrawing = this.startDrawing.bind(this);
        this.draw = this.draw.bind(this);
        this.stopDrawing = this.stopDrawing.bind(this);
    }

	getCanvas() {
		return this.ctx;
	}

    setCanvas(canvas: HTMLCanvasElement, pageId: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.setActivePage(pageId);
        this.addDrawingEvents();
    }

    setActivePage(pageId: number) {
        this.activePage = pageId;
        this.initPage(pageId);
        this.restoreLastState();
    }

    private initPage(pageId: number) {
        if (!this.history[pageId]) {
            this.history[pageId] = [];
            this.redoStack[pageId] = [];
        }
    }

    saveState() {
        if (!this.canvas || !this.ctx) return;

        const imageData = this.canvas.toDataURL();
        this.history[this.activePage].push({ type: "draw", data: imageData });
        this.lastSavedImage = imageData; // Сохраняем последнее изображение

        this.redoStack[this.activePage] = []; // Очищаем redo после нового действия
    }

    undo(pageId: number) {
        this.activePage = pageId;

        if (!this.history[this.activePage] || this.history[this.activePage].length === 0) {
            console.warn(`Нет действий для отмены на странице ${this.activePage}`);
            return;
        }

        const lastAction = this.history[this.activePage].pop();
        if (!lastAction) return;

        this.redoStack[this.activePage].push(lastAction);

        this.restoreLastState();
    }

    redo(pageId: number) {
		this.activePage = pageId;
	
		if (!this.redoStack[this.activePage] || this.redoStack[this.activePage].length === 0) {
			console.warn(`Нет действий для повтора на странице ${this.activePage}`);
			return;
		}
	
		const redoAction = this.redoStack[this.activePage].pop();
		if (!redoAction) return;
	
		this.history[this.activePage].push(redoAction);
	
		if (redoAction.type === "text") {
			this.textElements.push(redoAction.data as { content: string; x: number; y: number });
		}
	
		if (redoAction.type === "draw") {
			this.restoreState(redoAction.data as string);
		}
	
		this.redrawText();
	}
	

    restoreLastState() {
		console.log("Восстанавливаем состояние для страницы:", this.activePage);
		console.log("История:", this.history[this.activePage]);
	
		if (!this.canvas || !this.ctx) return;
	
		const lastDrawAction = this.history[this.activePage]
			.filter(action => action.type === "draw")
			.pop();
	
		if (lastDrawAction) {
			console.log("Восстанавливаем изображение:", lastDrawAction.data);
			this.restoreState(lastDrawAction.data);
		} else {
			this.clearCanvas();
		}
	
		this.textElements = this.history[this.activePage]
			.filter(action => action.type === "text")
			.map(action => action.data as { content: string; x: number; y: number });
	
		this.redrawText();
	}
	

    restoreState(imageData: string) {
        if (!this.canvas || !this.ctx) return;

        const img = new Image();
        img.src = imageData;
        img.onload = () => {
            if (!this.canvas || !this.ctx) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.redrawText();
        };
    }

    redrawText() {
        if (!this.ctx) return;

        this.textElements.forEach((text) => {
            this.ctx!.font = "20px Arial";
            this.ctx!.fillStyle = "black";
            this.ctx!.fillText(text.content, text.x, text.y);
        });
    }

    addText(content: string, x: number, y: number) {
        const newText = { content, x, y };
        this.textElements.push(newText);
        this.history[this.activePage].push({ type: "text", data: newText });
        this.redoStack[this.activePage] = []; // Очищаем redo после нового действия
        this.redrawText();
    }

    clearCanvas() {
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.textElements = [];
        }
    }

    // ======================== 🎨 ОБРАБОТКА РИСОВАНИЯ 🎨 ========================
    addDrawingEvents() {
        if (!this.canvas) return;

        this.canvas.addEventListener("mousedown", this.startDrawing);
        this.canvas.addEventListener("mousemove", this.draw);
        this.canvas.addEventListener("mouseup", this.stopDrawing);
        this.canvas.addEventListener("mouseleave", this.stopDrawing);
    }

    startDrawing(event: MouseEvent) {
        if (!this.canvas || !this.ctx) return;

        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(event.offsetX, event.offsetY);
    }

    draw(event: MouseEvent) {
        if (!this.isDrawing || !this.ctx) return;

        this.ctx.strokeStyle = this.brushColor; // ✅ Устанавливаем цвет кисти
        this.ctx.lineWidth = this.brushSize; // ✅ Устанавливаем толщину кисти
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        this.ctx.lineTo(event.offsetX, event.offsetY);
        this.ctx.stroke();
    }

    stopDrawing() {
        if (!this.isDrawing || !this.canvas) return;
        this.isDrawing = false;
        this.ctx?.beginPath(); // Разрываем линию, чтобы новая начиналась заново

        this.saveState(); // ✅ Теперь рисование сохраняется корректно
    }

    setBrushColor(color: string) {
        this.brushColor = color;
    }

    setBrushSize(size: number) {
        this.brushSize = size;
    }

    destroyEvents() {
        if (this.canvas) {
            this.canvas.removeEventListener("mousedown", this.startDrawing);
            this.canvas.removeEventListener("mousemove", this.draw);
            this.canvas.removeEventListener("mouseup", this.stopDrawing);
            this.canvas.removeEventListener("mouseleave", this.stopDrawing);
        }
    }
}

export default CanvasState;
*/


/*
class CanvasState {
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    currentPageId: number = 0;
    actionHistory: Record<number, { type: string; data: any }[]> = {};
    redoStack: Record<number, { type: string; data: any }[]> = {};

    constructor(canvas: HTMLCanvasElement, pageId: number) {
        this.setCanvas(canvas, pageId);
    }

    setCanvas(canvas: HTMLCanvasElement, pageId: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.currentPageId = pageId; // Устанавливаем ID страницы при установке canvas
        if (!this.actionHistory[pageId]) {
            this.actionHistory[pageId] = [];
            this.redoStack[pageId] = [];
        }
    }
    getCanvas() {
        return this.ctx;
    }

    saveState(actionType: string, data: any) {
        if (!this.canvas || !this.ctx) return;
        const pageId = this.currentPageId;
        
        if (!this.actionHistory[pageId]) {
            this.actionHistory[pageId] = [];
            this.redoStack[pageId] = [];
        }

        this.actionHistory[pageId].push({ type: actionType, data });
        this.redoStack[pageId] = []; // Очистить redo после нового действия
        this.redrawCanvas();
    }

    undo() {
        const pageId = this.currentPageId;
        if (!this.actionHistory[pageId] || this.actionHistory[pageId].length === 0) return;
        
        const lastAction = this.actionHistory[pageId].pop();
        if (lastAction) {
            this.redoStack[pageId].push(lastAction);
            this.redrawCanvas();
        }
    }

    redo() {
        const pageId = this.currentPageId;
        if (!this.redoStack[pageId] || this.redoStack[pageId].length === 0) return;
        
        const lastUndoneAction = this.redoStack[pageId].pop();
        if (lastUndoneAction) {
            this.actionHistory[pageId].push(lastUndoneAction);
            this.applyAction(lastUndoneAction);
        }
    }

    clearCanvas() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    redrawCanvas() {
        this.clearCanvas();
        const pageId = this.currentPageId;
        if (this.actionHistory[pageId]) {
            this.actionHistory[pageId].forEach(action => this.applyAction(action));
        }
    }

    applyAction(action: { type: string; data: any }) {
        if (!this.ctx || !this.canvas) return;

        switch (action.type) {
            case "draw":
                this.ctx.beginPath();
                action.data.points.forEach((point: { x: number; y: number }) => {
                    (this.ctx) ? this.ctx.lineTo(point.x, point.y) : null;
                });
                this.ctx.stroke();
                break;
            case "text":
                this.ctx.font = "20px Arial";
                this.ctx.fillText(action.data.content, action.data.x, action.data.y);
                break;
            case "erase":
                this.ctx.clearRect(action.data.x, action.data.y, action.data.width, action.data.height);
                break;
        }
    }

    destroyEvents() {
        if (this.canvas) {
            this.canvas.onmousedown = null;
            this.canvas.onmousemove = null;
            this.canvas.onmouseup = null;
        }
    }
}

//export default new CanvasState(null as unknown as HTMLCanvasElement, 0); // Инициализация с фиктивным canvas и pageId
export default CanvasState;
*/


/*
// canvasState.ts
import { makeAutoObservable } from "mobx";

class CanvasState {
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    currentPageId: number = 0;
    actionHistory: Record<number, { type: string; data: any }[]> = {};
    redoStack: Record<number, { type: string; data: any }[]> = {};

    constructor() {
        makeAutoObservable(this);
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    getCanvas() {
        return this.ctx;
    }

    saveState(actionType: string, data: any) {
        if (!this.canvas || !this.ctx) return;
        const pageId = this.currentPageId;
        
        if (!this.actionHistory[pageId]) {
            this.actionHistory[pageId] = [];
            this.redoStack[pageId] = [];
        }

        this.actionHistory[pageId].push({ type: actionType, data });
        this.redoStack[pageId] = []; // Очистить redo после нового действия
    }

    undo() {
        const pageId = this.currentPageId;
        if (!this.actionHistory[pageId] || this.actionHistory[pageId].length === 0) return;
        
        const lastAction = this.actionHistory[pageId].pop();
        if (lastAction) {
            this.redoStack[pageId].push(lastAction);
            this.redrawCanvas();
        }
    }

    redo() {
        const pageId = this.currentPageId;
        if (!this.redoStack[pageId] || this.redoStack[pageId].length === 0) return;
        
        const lastUndoneAction = this.redoStack[pageId].pop();
        if (lastUndoneAction) {
            this.actionHistory[pageId].push(lastUndoneAction);
            this.applyAction(lastUndoneAction);
        }
    }

    clearCanvas() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    redrawCanvas() {
        this.clearCanvas();
        const pageId = this.currentPageId;
        if (this.actionHistory[pageId]) {
            this.actionHistory[pageId].forEach(action => this.applyAction(action));
        }
    }

    applyAction(action: { type: string; data: any }) {
        if (!this.ctx || !this.canvas) return;

        switch (action.type) {
            case "draw":
                this.ctx.beginPath();
                action.data.points.forEach((point: { x: number; y: number }) => {
                    this.ctx?.lineTo(point.x, point.y);
                });
                this.ctx.stroke();
                break;
            case "text":
                this.ctx.font = "20px Arial";
                this.ctx.fillText(action.data.content, action.data.x, action.data.y);
                break;
            case "erase":
                this.ctx.clearRect(action.data.x, action.data.y, action.data.width, action.data.height);
                break;
        }
    }
}

export default new CanvasState();
*/

import { makeAutoObservable } from "mobx";

type Action = { type: string; data: any };
type WSAction = {
  lessonId: string;
  pageIndex: number;
  type: string;
  data: any;
  userEmail: string;
};

class CanvasState {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  currentPageId: number = 0;

  actionHistory: Record<number, Action[]> = {};
  redoStack: Record<number, Action[]> = {};
  snapshotPerPage: Record<number, HTMLImageElement | null> = {};

  // страницы для сохранения в БД, а не Redis
  dirtyPages: Record<number, boolean> = {};


  // 🔥 WebSocket: сюда Desk.tsx передаст socket + данные
  socket: any = null;
  lessonId: string = "";
  userEmail: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  /** =========================================
   * ИНИЦИАЛИЗАЦИЯ WebSocket
   * ========================================= */
  initSocket(socket: any, lessonId: string, userEmail: string) {
    this.socket = socket;
    this.lessonId = lessonId;
    this.userEmail = userEmail;

    if (!socket) return;

    socket.on("board:action", async (action: WSAction) => {
      const { pageIndex, type, data } = action;

      // игнорируем свои же сообщения
      if (action.userEmail === this.userEmail) return;

      console.log("📥 Получили action от другого пользователя:", action);

      // сохраняем в историю
      if (!this.actionHistory[pageIndex]) this.actionHistory[pageIndex] = [];
      this.actionHistory[pageIndex].push({ type, data });

      // рисуем
      this.applyAction({ type, data });
    });

    // Record - обьект/ассоциативный массив/словарь с заранее определёнными ключами и значениями одинакового типа
    socket.on("board:fullState", (state: Record<number, Action[]>) => {
        console.log("📥 fullState:", state);
      
        // грузим историю
        this.actionHistory = state;
      
        // создаём пустой redo стек для всех страниц
        this.redoStack = {};
        for (const page in state) {
          this.redoStack[page] = [];
        }
      
        // перерисовываем только текущую
        this.redrawCanvas(this.currentPageId);
      });
      
      
  }

  /** =========================================
   * Установка текущего canvas
   * ========================================= */
  setCanvas(canvas: HTMLCanvasElement, pageId: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.currentPageId = pageId;

    if (!this.actionHistory[pageId]) {
      this.actionHistory[pageId] = [];
      this.redoStack[pageId] = [];
    }

    // Перерисовать после переключения страниц
    this.redrawCanvas(pageId);
  }

  setSnapshot(pageId: number, img: HTMLImageElement | null) {
    this.snapshotPerPage[pageId] = img;
  }

  /** =========================================
   * Главный метод: Сохранение действия
   * ========================================= */
  saveState(actionType: string, data: any, pageId: number) {
    if (!this.canvas || !this.ctx) return;

    if (!this.actionHistory[pageId]) {
      this.actionHistory[pageId] = [];
      this.redoStack[pageId] = [];
    }

    this.actionHistory[pageId].push({ type: actionType, data });
    this.redoStack[pageId] = [];

    console.log(`💾 saveState → ${actionType}`, data);

    // 🔥 Отправляем в WebSocket
    if (this.socket) {
        this.dirtyPages[pageId] = true;
      const wsAction: WSAction = {
        lessonId: this.lessonId,
        pageIndex: pageId,
        type: actionType,
        data,
        userEmail: this.userEmail
      };
      this.socket.emit("board:action", wsAction);
    }
  }

  /** =========================================
   * Undo / Redo
   * ========================================= */
  undo(pageId: number) {
    if (!this.actionHistory[pageId]?.length) return;

    const last = this.actionHistory[pageId].pop()!;
    this.redoStack[pageId].push(last);

    this.redrawCanvas(pageId);
  }

  redo(pageId: number) {
    if (!this.redoStack[pageId]?.length) return;

    const last = this.redoStack[pageId].pop()!;
    this.actionHistory[pageId].push(last);

    this.applyAction(last);
  }

  /** =========================================
   * Перерисовка страницы
   * ========================================= */
  clearCanvas() {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  redrawCanvas(pageId: number) {
    if (!this.canvas || !this.ctx) return;

    this.clearCanvas();

    /////////////////////////////////////////////////////////

    const snapshot = this.snapshotPerPage[pageId];
    if (snapshot) {
      this.ctx.drawImage(snapshot, 0, 0);
    }

    ////////////////////////////////////////////////////////////
    const actions = this.actionHistory[pageId] || [];
    console.log(actions);

    actions.forEach((a) => this.applyAction(a));
  }

  /** =========================================
   * Применение одного действия
   * ========================================= */
  applyAction(action: Action) {
    if (!this.ctx || !this.canvas) return;

    const { type, data } = action;

    switch (type) {
      case "brush":
        this.ctx.beginPath();
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = data.lineWidth;
        data.points.forEach((p: any, i: number) => {
            if(this.ctx) {
                if (i === 0) {
                    this.ctx.moveTo(p.x, p.y);
                } 
                else {
                    this.ctx.lineTo(p.x, p.y);
                }
            }
        });
        this.ctx.stroke();
        break;

      case "erase":
        const prev = this.ctx.globalCompositeOperation;
        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.beginPath();
        this.ctx.lineWidth = data.lineWidth;
        
        data.points.forEach((p: any, i: number) => {
            if(this.ctx) {
                if (i === 0) {
                    this.ctx.moveTo(p.x, p.y);
                } 
                else {
                    this.ctx.lineTo(p.x, p.y);
                }
            }
        });
        this.ctx.stroke();
        this.ctx.globalCompositeOperation = prev;
        break;

      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(data.x, data.y, data.r, 0, Math.PI * 2);
        this.ctx.fillStyle = data.color;
        this.ctx.fill();
        this.ctx.strokeStyle = data.color;
        this.ctx.stroke();
        break;

      case "rect":
        this.ctx.fillStyle = data.color;
        this.ctx.strokeStyle = data.color;
        this.ctx.fillRect(data.x, data.y, data.width, data.height);
        this.ctx.strokeRect(data.x, data.y, data.width, data.height);
        break;

      case "line":
        this.ctx.beginPath();
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = data.lineWidth;
        this.ctx.moveTo(data.startX, data.startY);
        this.ctx.lineTo(data.endX, data.endY);
        this.ctx.stroke();
        break;

      case "text":
        this.ctx.font = "20px Arial";
        this.ctx.fillText(data.content, data.x, data.y);
        break;
    }
  }
}

export default new CanvasState();









/*
class CanvasState {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private history: { imageData: string; textElements: any[] }[] = [];
	private redoStack: { imageData: string; textElements: any[] }[] = [];
	public textElements: { content: string; x: number; y: number }[] = [];
  
	constructor(canvas: HTMLCanvasElement) {
	  this.canvas = canvas;
	  this.ctx = canvas.getContext("2d")!;
	  this.saveState();
	}
  
	saveState() {
	  const imageData = this.canvas.toDataURL();
	  const textElementsCopy = [...this.textElements]; // Копируем массив текста
	  this.history.push({ imageData, textElements: textElementsCopy });
	  this.redoStack = []; // Очищаем redo после нового действия
	  console.log("Сохраняем состояние:", this.history[this.history.length - 1]);
	}
  
	undo() {
	  if (this.history.length > 1) {
		this.redoStack.push(this.history.pop()!); // Убираем последний и сохраняем в redo
		const prevState = this.history[this.history.length - 1]; // Берем предыдущий
		this.restoreState(prevState);
		console.log("Восстанавливаем состояние (undo):", prevState);
	  }
	}
  
	redo() {
	  if (this.redoStack.length > 0) {
		const redoState = this.redoStack.pop()!;
		this.history.push(redoState);
		this.restoreState(redoState);
		console.log("Восстанавливаем состояние (redo):", redoState);
	  }
	}
  
	restoreState(state: { imageData: string; textElements: any[] }) {
	  const img = new Image();
	  img.src = state.imageData;
	  img.onload = () => {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(img, 0, 0);
		this.textElements = [...state.textElements]; // ВОССТАНОВЛЕНИЕ ТЕКСТА
		this.redrawText();
		console.log("Текущий текст после восстановления:", this.textElements);
	  };
	}
  
	redrawText() {
	  this.textElements.forEach((text) => {
		this.ctx.fillText(text.content, text.x, text.y);
	  });
	  console.log("Перерисовываем текстовые элементы:", this.textElements);
	}
  }
  
  export default CanvasState;
  */

  