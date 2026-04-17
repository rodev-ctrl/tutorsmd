import canvasState from "../../../../../app/store/canvasState";
import Tool from "./Tool";


interface TextElement {
    content: string;
    x: number;
    y: number;
}


class TextTool extends Tool {
    inputElement: HTMLTextAreaElement | null = null;
    isRemoving = false;
    textElements: { content: string; x: number; y: number }[] = [];
    isTextMode = false;
    currentPageId: number = 0;
    canvasRef: HTMLCanvasElement | null = null; // Изменяем тип = null;
    pageId: number = 0;


    constructor(canvas: HTMLCanvasElement, pageId: number) {
        super(canvas);
        if(this.canvasRef && "current" in this.canvasRef && this.canvasRef.current && this.canvasRef.current as HTMLCanvasElement) {
            this.canvasRef = canvas;
            }
            this.pageId = pageId
            this.isTextMode = true;
        this.listen();
 
    }

    listen() {
        this.canvas.onmousedown = this.onMouseDown.bind(this);
    }

    setTextMode(enabled: boolean) {
        this.isTextMode = enabled;
    }

    onMouseDown(e: MouseEvent) {
        if (!this.isTextMode) return;

        const ctx = this.canvas.getContext("2d");
        if (!ctx) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        //if (this.inputElement) return;

        const clickedText = this.textElements.find(
            (t) => x >= t.x && x <= t.x + ctx.measureText(t.content).width && y >= t.y - 20 && y <= t.y
        );

        if (clickedText) {
            this.editText(ctx, clickedText);
            return;
        }

        this.createInput(ctx, x, y);
    }
    createInput(ctx: CanvasRenderingContext2D, x: number, y: number, existingText: string = "") {
      if (this.inputElement) return;
  
      this.inputElement = document.createElement("textarea");
      this.inputElement.style.position = "absolute";
  
      this.inputElement.style.padding = "10px";
      this.inputElement.style.fontSize = "20px";
      this.inputElement.style.border = "2px solid green";
      this.inputElement.style.background = "white";
      this.inputElement.style.color = "black";
      this.inputElement.style.zIndex = "100000";
      this.inputElement.style.width = "200px";
      this.inputElement.style.minWidth = "50px";
      this.inputElement.style.maxWidth = "500px";
      this.inputElement.style.minHeight = "30px";
      this.inputElement.style.maxHeight = "300px";
      this.inputElement.style.wordWrap = "break-word";
      this.inputElement.style.whiteSpace = "pre-wrap";
      this.inputElement.style.resize = "both"; // Позволяем изменять размер
      this.inputElement.style.overflowY = "hidden";
      this.inputElement.style.boxSizing = "border-box"; // Корректный расчет размеров
  
      this.inputElement.value = existingText;
  
   
 // Вставляем в текущий canvas
 this.canvas.parentElement?.appendChild(this.inputElement);

      const rect = this.canvas.getBoundingClientRect();
      this.inputElement.style.left = `${rect.left + x}px`;
      this.inputElement.style.top = `${rect.top + y}px`;


   
      this.autoResize(this.inputElement);
      const textElement = {
         content: existingText,
         x: x,
         y: y
      }
        this.inputElement.addEventListener("input", () => {this.autoResize(this.inputElement); if(this.inputElement) {this.updateText(textElement, this.inputElement.value);}});
      
      
  
      this.makeDraggableResizable(this.inputElement);
  
      this.inputElement.addEventListener("blur", () => this.saveText(ctx, x, y, this.inputElement!.value));
      this.inputElement.focus(); 
  }
  
  autoResize(element: HTMLTextAreaElement|null) {
    if(element) {
      element.style.height = "auto";
      element.style.height = element.scrollHeight + "px";
    }

  }
  
  makeDraggableResizable(element: HTMLTextAreaElement) {
    let offsetX = 0, offsetY = 0, isDragging = false;
    let clickTimeout: NodeJS.Timeout | null = null;

    element.addEventListener("mousedown", (e) => {
        // Проверяем, если это двойной клик — не двигаем, а выделяем текст
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            return;
        }

        clickTimeout = setTimeout(() => {
            clickTimeout = null; // Сбрасываем таймер, если двойного клика не произошло
            const { width, height } = element.getBoundingClientRect();
            const resizeZone = 10;
            const isResizing = e.offsetX > width - resizeZone || e.offsetY > height - resizeZone;

            if (!isResizing) {
                isDragging = true;
                offsetX = e.clientX - element.offsetLeft;
                offsetY = e.clientY - element.offsetTop;

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            }
        }, 200); // Задержка для определения одиночного клика
    });

    element.addEventListener("dblclick", (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }

        element.select(); // Выделяем текст
    });

    function onMouseMove(e: MouseEvent) {
        if (isDragging) {
            const canvasRect = document.querySelector(".canvas")?.getBoundingClientRect();
            if (!canvasRect) return;

    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;

    // Границы textarea внутри canvas
    const maxX = canvasRect.right - element.offsetWidth;
    const maxY = canvasRect.bottom - element.offsetHeight;
    const minX = canvasRect.left;
    const minY = canvasRect.top + 150;

    // Ограничиваем передвижение
    element.style.left = `${Math.min(Math.max(newX, minX), maxX)}px`;
    element.style.top = `${Math.min(Math.max(newY, minY), maxY)}px`;

        }
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }
}

saveText(ctx: CanvasRenderingContext2D, x: number, y: number, content: string) {
    if (!content.trim()) return;

    const textData: TextElement = { content, x, y };

    // Проверяем, есть ли уже такой текст
    const existingIndex = canvasState.actionHistory[this.pageId]?.findIndex(
      (a) => a.type === "text" && a.data.x === x && a.data.y === y
    );

    if (existingIndex !== undefined && existingIndex !== -1) {
      // Обновляем существующий текст
      canvasState.actionHistory[this.pageId]![existingIndex].data = textData;
    } else {
      // Сохраняем новое состояние текста
      canvasState.saveState("text", textData, this.pageId);
    }

    console.log("TextTool: Сохранен текст", textData);
  }

    editText(ctx: CanvasRenderingContext2D, textObj: TextElement) {
        this.createInput(ctx, textObj.x, textObj.y, textObj.content);
    }

    updateText(textElement: TextElement, newText: string) {
        if (textElement.content !== newText) {
            textElement.content = newText;
            canvasState.saveState("text", { ...textElement }, this.pageId);
            console.log("💾 Изменение текста сохранено", textElement);
        }
    }
}

export default TextTool;


/*
import Tool from "./Tool";

class TextTool extends Tool {
    inputElement: HTMLTextAreaElement | null = null;
    isRemoving = false;
    textElements: { text: string; x: number; y: number }[] = [];
    isTextMode = false;
    isDragging = false;
    isResizing = false;
    resizeDirection: "left" | "right" | "top" | "bottom" | null = null;
    wrapper: HTMLDivElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.listen();
    }

    listen() {
        this.canvas.onmousedown = this.onMouseDown.bind(this);
    }

    setTextMode(enabled: boolean) {
        this.isTextMode = enabled;
    }

    onMouseDown(e: MouseEvent) {
        if (!this.isTextMode) return;

        const ctx = this.canvas.getContext("2d");
        if (!ctx) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.inputElement) return;

        const clickedText = this.textElements.find(
            (t) => x >= t.x && x <= t.x + ctx.measureText(t.text).width && y >= t.y - 20 && y <= t.y
        );

        if (clickedText) {
            this.editText(ctx, clickedText);
            return;
        }

        this.createInput(ctx, x, y);
    }

    createInput(ctx: CanvasRenderingContext2D, x: number, y: number, existingText: string = "") {
        if (this.inputElement) return;

        this.inputElement = document.createElement("textarea");
        //this.inputElement.type = "text";
        this.inputElement.style.position = "absolute";
        this.inputElement.style.fontSize = "20px";
        this.inputElement.style.border = "2px solid green";
        this.inputElement.style.background = "white";
        this.inputElement.style.color = "black";
        this.inputElement.style.zIndex = "100000";
        this.inputElement.style.width = "200px";
        this.inputElement.style.height = "30px";
        this.inputElement.style.resize = "horizontal";
        //this.inputElement.style.overflow = "hidden";
        this.inputElement.style.overflowY = "auto";
        this.inputElement.style.minWidth = "200px";
        //this.inputElement.style.minHeight = "30px";
        this.inputElement.style.maxWidth = "500px";
        this.inputElement.style.maxHeight = "300px";
        this.inputElement.style.wordWrap = "break-word";
        this.inputElement.style.whiteSpace = "pre-wrap";
        this.inputElement.style.boxSizing = "border-box"; // Корректный расчет размеров
        this.inputElement.style.left = `${x}px`;
        this.inputElement.style.top = `${y}px`;
        //this.inputElement.style.overflowY = "hidden";
        this.inputElement.value = existingText;

        const parent = document.querySelector(".canvasPaint");
        console.log(parent);
        if (!parent) return;

        this.wrapper = document.createElement("div");
        this.wrapper.style.position = "absolute";
        this.wrapper.style.left = `${x}px`;
        this.wrapper.style.top = `${y}px`;
        this.wrapper.style.width = this.inputElement.style.width;
        this.wrapper.style.height = this.inputElement.style.height;
        //this.wrapper.style.zIndex = "100000";
        this.wrapper.style.display = "block";
        this.wrapper.style.border = "1px solid gray";
        this.wrapper.style.resize = "both";
        this.wrapper.style.overflow = "hidden";

        this.wrapper.appendChild(this.inputElement);
        console.log(this.inputElement);
        console.log(this.wrapper);
        parent.appendChild(this.wrapper);
        console.log(this.wrapper);

        const rect = this.canvas.getBoundingClientRect();
       // this.inputElement.style.left = `${x - 253}px`;
       // this.inputElement.style.top = `${y + 300}px`;
       this.inputElement.style.left = `0px`;
       this.inputElement.style.top = `0px`;

        this.autoResize(this.inputElement);
    
        if(this.inputElement) {
          this.inputElement.addEventListener("input", () => this.autoResize(this.inputElement));
        }
        

        //this.makeDraggable(this.inputElement);
        this.makeDraggableResizable(this.inputElement);
        this.inputElement.focus();
    }

    autoResize(element: HTMLTextAreaElement | null) {
      if(element) {
        element.style.height = "auto"; // Сбрасываем высоту, чтобы правильно измерить
        element.style.height = element.scrollHeight + "px"; // Устанавливаем новую высоту
      }

  }


  
  makeDraggableResizable(element:HTMLTextAreaElement) {
    let offsetX = 0, offsetY = 0, isDragging = false, isResizing = false;
    let resizeDirection: "left" | "right" | "top" | "bottom" | null = null;

    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = element.style.left;
    wrapper.style.top = element.style.top;
    wrapper.style.width = element.style.width;
    wrapper.style.height = element.style.height;
    wrapper.style.zIndex = "100000";
    wrapper.style.display = "flex";

    const handles = {
        left: this.createResizeHandle("w-resize", "left"),
        right: this.createResizeHandle("e-resize", "right"),
        top: this.createResizeHandle("n-resize", "top"),
        bottom: this.createResizeHandle("s-resize", "bottom"),
    };

    wrapper.appendChild(element);
    wrapper.appendChild(handles.left);
    wrapper.appendChild(handles.right);
    wrapper.appendChild(handles.top);
    wrapper.appendChild(handles.bottom);

    //document.body.appendChild(wrapper);

    element.onmousedown = (e) => {
        isDragging = true;
        offsetX = e.clientX - wrapper.offsetLeft;
        offsetY = e.clientY - wrapper.offsetTop;
        document.onmousemove = (ev) => {
            if (isDragging) {
                wrapper.style.left = `${ev.clientX - offsetX}px`;
                wrapper.style.top = `${ev.clientY - offsetY}px`;
            }
        };
        document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };

    function onResize(e: MouseEvent) {
        if (!isResizing || !resizeDirection) return;
        if (resizeDirection === "left" || resizeDirection === "right") {
            const newWidth = e.clientX - wrapper.offsetLeft;
            if (newWidth > 50) wrapper.style.width = `${newWidth}px`;
        }
        if (resizeDirection === "top" || resizeDirection === "bottom") {
            const newHeight = e.clientY - wrapper.offsetTop;
            if (newHeight > 30) wrapper.style.height = `${newHeight}px`;
        }
    }

    function onResizeEnd() {
        isResizing = false;
        resizeDirection = null;
        document.removeEventListener("mousemove", onResize);
        document.removeEventListener("mouseup", onResizeEnd);
    }
}


createResizeHandle(cursor: string, direction: "left" | "right" | "top" | "bottom") {
  const handle = document.createElement("div");
  handle.style.position = "absolute";
  handle.style.width = "10px";
  handle.style.height = "10px";
  handle.style.background = "transparent";
  handle.style.zIndex = "100001";
  handle.style.cursor = cursor;

  if (direction === "left" || direction === "right") {
    handle.style.width = "10px";
    handle.style.height = "100%";
    handle.style.top = "0";
    handle.style[direction] = "-5px";
} else {
    handle.style.width = "100%";
    handle.style.height = "10px";
    handle.style.left = "0";
    handle.style[direction] = "-5px";
}

  handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      this.isResizing = true;
      this.resizeDirection = direction;
      document.addEventListener("mousemove", this.onResize.bind(this));
      document.addEventListener("mouseup",  this.onResizeEnd.bind(this));
  });
  return handle;
}

onResize(e: MouseEvent) {
  if (!this.wrapper || !this.isResizing || !this.resizeDirection) return;

  const rect = this.wrapper.getBoundingClientRect();
  if (this.resizeDirection === "left" || this.resizeDirection === "right") {
      const newWidth = e.clientX - rect.left;
      if (newWidth > 50) this.wrapper.style.width = `${newWidth}px`;
  }
  if (this.resizeDirection === "top" || this.resizeDirection === "bottom") {
      const newHeight = e.clientY - rect.top;
      if (newHeight > 30) this.wrapper.style.height = `${newHeight}px`;
  }
}

onResizeEnd() {
  this.isResizing = false;
  this.resizeDirection = null;
  document.removeEventListener("mousemove", this.onResize.bind(this));
  document.removeEventListener("mouseup", this.onResizeEnd.bind(this));
}


    saveText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
        if (!text.trim()) return;

        const existingTextIndex = this.textElements.findIndex((t) => t.x === x && t.y === y);
        if (existingTextIndex !== -1) {
            this.textElements[existingTextIndex].text = text;
        } else {
            this.textElements.push({ text, x, y });
        }
        this.redraw(ctx);
        if(this.inputElement) {
          this.inputElement.style.border = "0px solid green";
        }
        
    }

    editText(ctx: CanvasRenderingContext2D, textObj: { text: string; x: number; y: number }) {
        this.createInput(ctx, textObj.x, textObj.y, textObj.text);
    }

    redraw(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.textElements.forEach(({ text, x, y }) => {
            ctx.font = "20px Arial";
            ctx.fillStyle = "black";
            const lines = text.split("\n");
            lines.forEach((line, i) => {
                ctx.fillText(line, x, y + i * 24);
            });
        });
    }
}

export default TextTool;
*/




