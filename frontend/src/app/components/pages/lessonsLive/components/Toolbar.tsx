/*
"use strict"

import html2canvas from "html2canvas";
import jsPDF from "jspdf";



import canvasState from "../../../../store/canvasState";
import toolState from "../../../../store/toolState";
import Brush from "../instruments/Brush";
import React, { RefObject, useEffect, useState } from 'react';
import Rect from "../instruments/Rect";
import Circle from "../instruments/Circle";
import Eraser from "../instruments/Eraser";
import Line from "../instruments/Line";
import Text from "../instruments/Text";


import '../instruments/styles/toolbar.css';
import Tool from "../instruments/Tool";
import { Button, ButtonGroup } from "@mui/material";


const TextPhoto = require("../img/text.png");



type Props = {
  canvasRef: RefObject<HTMLCanvasElement>;
  language: string;
  pageId: number
};


  const Toolbar = ({canvasRef, language, pageId}:Props) => {
    

    const [currentColor, setCurrentColor] = useState<string>("black");
    const [currentLineWidth, setCurrentLineWidth] = useState<number>(10);
    const [currentFigure, setCurrentFigure] = useState<string>("circle");
    const [isFigureOpened, setIsFigureOpened] = useState<boolean>(false);
    const [classOfAnimation, setClassOfAnimation] = useState<string>("hide");
    const [tool, setTool] = useState<Tool | null>(null);
    const [modeButtonGroup, setModeButtonGroup] = useState<string>("");
    const [moreInstrumentsOpened, setMoreInstrumentsOpened] = useState<boolean>(false);

    useEffect(() => {
      if (canvasRef.current) {
        canvasState.setCanvas(canvasRef.current, pageId);
      }
    }, [canvasRef, pageId]);

 
    const changeColor = (e: { target: { value: any; }; }) => {
      const newColor = e.target.value;
      console.log(`Новый цвет выбран: ${newColor}`);
      toolState.setStrokeColor(newColor);
      toolState.setFillColor(newColor);
      setCurrentColor(newColor);
      
      // Обновляем цвет в текущем инструменте
      if (toolState.tool instanceof Circle) {
          toolState.updateColor(newColor);
      }
  };
  
    const setToolSafely = (ToolClass: typeof Brush | typeof Rect | typeof Circle | typeof Line | typeof Eraser) => {

     
    if(canvasState && canvasRef.current && new canvasState(canvasRef.current, pageId).getCanvas() && "getCanvas" in canvasState) {
    
     

            // Отключаем обработчики у предыдущего инструмента
      if (toolState.tool) {
        toolState.tool.destroyEvents();
      }

        const tool = new ToolClass(canvasRef.current, pageId);
        console.log("Установленный инструмент:", tool); // Проверяем, какой инструмент устанавливается
       
        if (tool instanceof Brush && !(tool instanceof Eraser)) {
          console.log("Установлен инструмент: Brush");
      
          if (toolState.tool?.lineWidth) {
            tool.lineWidth = toolState.tool?.lineWidth;
            toolState.setLineWidth(currentLineWidth);
          } else {
            tool.lineWidth = 5;
          }
      
          if (toolState.tool?.strokeColor) {
            tool.strokeColor = toolState.tool?.strokeColor;
            console.log("Цвет кисти:", tool.strokeColor);
          } else {
            tool.strokeColor = currentColor;
          }
        }

        console.log(tool);
      
        toolState.setTool(tool);
      

    }
 

    };
    

    // Функция для сохранения PDF
    const saveAsPDF = async () => {
      console.log("save desk");
      if (!canvasRef.current) return;
  
      // Рендерим canvas в изображение
      const canvas = canvasRef.current;
      console.log(canvas);
      const image = await html2canvas(canvas);
      console.log(image);
  
      // Создаем PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = image.toDataURL("image/png");
  
      // Рассчитываем размер, чтобы подогнать под A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (image.height * pdfWidth) / image.width;
  
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("canvas.pdf");
      console.log(pdf);
    };

    useEffect(() => {
      const interval = setInterval(() => {
       // saveAsPDF();
      }, 30000); // 30 секунд
    
      return () => clearInterval(interval); // Очистка таймера при размонтировании
    }, []);

    useEffect(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
    }, []);



    const changeLineWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
      const width = parseInt(e.target.value);
      toolState.setLineWidth(width);
      setCurrentLineWidth(width);
    };

    const toggleFigureMenu = () => {
      if (!isFigureOpened) {
        setIsFigureOpened(true);
        setTimeout(() => setClassOfAnimation("show"), 10); // Задержка, чтобы `display` не мешал анимации
      } else {
        setClassOfAnimation("hide");
        setTimeout(() => setIsFigureOpened(false), 300); // Ждем завершения анимации перед скрытием
      }
    };
    
    
    useEffect(() => {
      if (canvasRef.current) {
        setTool(new Brush(canvasRef.current, pageId));
      }
    }, []);

    useEffect(() => {
      if(window.innerWidth < 800) {
          setModeButtonGroup("mobile");
      } else {
          setModeButtonGroup("dekstop");
      }
      console.log(window.innerWidth);
      console.log(modeButtonGroup);
    }, [])



  return (
    <div>
      <div className="toolbar">
{modeButtonGroup == "dekstop" ? (
        <ButtonGroup>
        <button className="toolbar__btn brush" onClick={() => {setToolSafely(Brush); toolState.setFillColor(currentColor); toolState.setStrokeColor(currentColor) }} />
      <input type="range" min="1" max="50" value={currentLineWidth} onChange={changeLineWidth} />
      <button className="toolbar__btn eraser" onClick={() => setToolSafely(Eraser)} />
      <button className={`toolbar__btn ${currentFigure}`} onClick={toggleFigureMenu} />
      <button className={`toolbar__btn text`} onClick={() => {
if (canvasState && canvasRef.current && new canvasState(canvasRef.current, pageId).getCanvas()) {
  console.log("Canvas при установке инструмента Text:", new canvasState(canvasRef.current, pageId).getCanvas());

  if (canvasRef.current) {
    const textTool = new Text(canvasRef.current, pageId); // ✅ Передаём два аргумента
    textTool.setTextMode(true); // Включаем текстовый режим
    toolState.setTool(textTool);
    console.log("Установлен TextTool:", textTool);
  }
}
 else {
      console.error("Canvas не найден при установке TextTool!");
    }
  
  }}>

        <img src={TextPhoto} title="text" width={25} height={25} />
      </button>

      <input type="color" className="toolbar__btn gradient" onChange={changeColor} />

        </ButtonGroup>
) : (
     <div style={{marginLeft: "2%"}}>
      <Button
         onClick={() => setMoreInstrumentsOpened(!moreInstrumentsOpened)}
         style={{paddingTop: "15px", paddingBottom: "15px"}}>
          {(language == "german") ? "Tools" : "Инструменты"}
      </Button>
      <div className="currentInstrument"></div>
     </div>
)}


      
      <button className="toolbar__btn undo" onClick={() => (tool instanceof Tool && canvasRef.current) ? new canvasState(canvasRef.current, pageId).undo() : null} />
      <button className="toolbar__btn redo" onClick={() => (tool instanceof Tool && canvasRef.current) ? new canvasState(canvasRef.current, pageId).redo() : null} />
      <button className="toolbar__btn save" onClick={saveAsPDF} />
      </div>

      {isFigureOpened ? (
              <div className={`flex moreInstruments ${classOfAnimation}`}>
                <button className="toolbar__btn rect" onClick={() => {setToolSafely(Rect); setIsFigureOpened(false); setCurrentFigure("rect")}} />
                <button className="toolbar__btn circle" onClick={() => {setToolSafely(Circle); setIsFigureOpened(false); setCurrentFigure("circle")}} />
                <button className="toolbar__btn line" onClick={() => {setToolSafely(Line); setIsFigureOpened(false); setCurrentFigure("line")}} />
              </div>
             ) : 
              null
        }

{(moreInstrumentsOpened ? (
        <div className="block" style={{position: "relative", top: "80px", zIndex: 1000000000}}>
        <button className="toolbar__btn brush" onClick={() => setToolSafely(Brush)} />
        <button className="toolbar__btn eraser" onClick={() => setToolSafely(Eraser)} />
        <button className={`toolbar__btn ${currentFigure}`} onClick={toggleFigureMenu} />
        
  <button className={`toolbar__btn text`} onClick={() => {
    if (canvasState && canvasRef.current && canvasState.getCanvas() && canvasRef.current) {
      console.log("Устанавливаем TextTool...");
      const textTool = new Text(canvasRef.current, pageId);
      textTool.setTextMode(true); // Включаем текстовый режим
      toolState.setTool(textTool);
      setTool(textTool); // Обновляем состояние
      console.log("TextTool установлен:", textTool);
    } else {
      console.error("Canvas не найден!");
    }
}}>
    <img src={TextPhoto} title="text" width={25} height={25} />
</button>
     </div>
    ) : null
    )}
    </div>
  );
};

export default Toolbar;
*/

"use strict";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { RefObject, useEffect, useState } from "react";
import { Button, ButtonGroup } from "@mui/material";

import canvasState from "../../../../store/canvasState";
import toolState from "../../../../store/toolState";
import Brush from "../instruments/Brush";
import Rect from "../instruments/Rect";
import Circle from "../instruments/Circle";
import Eraser from "../instruments/Eraser";
import Line from "../instruments/Line";
import Text from "../instruments/Text";

import "../instruments/styles/toolbar.css";
import Tool from "../instruments/Tool";

const TextPhoto = require("../img/text.png");

type Props = {
  canvasRef: RefObject<HTMLCanvasElement>;
  pageId: number;
};

const Toolbar = ({ canvasRef, pageId }: Props) => {
  const [currentColor, setCurrentColor] = useState<string>("black");
  const [currentLineWidth, setCurrentLineWidth] = useState<number>(10);
  const [currentFigure, setCurrentFigure] = useState<string>("circle");
  const [isFigureOpened, setIsFigureOpened] = useState<boolean>(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [opacityMoreInstruments, setOpacityMoreInstruments] = useState<number>(0);

  
  /*
  useEffect(() => {
    if (canvasRef.current) {
      canvasState.setCanvas(canvasRef.current, pageId);
    }
  }, [canvasRef, pageId]);
  */

  const changeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    toolState.setStrokeColor(newColor);
    toolState.setFillColor(newColor);
    setCurrentColor(newColor);

    /*
    if (canvasRef.current) {
      canvasState.setCanvas(canvasRef.current, pageId);
    }
 */   
  };

  const setToolSafely = (ToolClass: typeof Brush | typeof Rect | typeof Circle | typeof Line | typeof Eraser | typeof Text) => {
    if (canvasRef.current) {
      if (toolState.tool) {
        toolState.tool.destroyEvents();
      }
      const toolInstance = new ToolClass(canvasRef.current, pageId);
      toolState.setTool(toolInstance);
      setTool(toolInstance);

      if (toolInstance instanceof Text) {
        toolInstance.setTextMode(true);
      }
    }
  };

  const saveAsPDF = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const image = await html2canvas(canvas);
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = image.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (image.height * pdfWidth) / image.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("canvas.pdf");
  };

  const changeLineWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value);
    toolState.setLineWidth(width);
    setCurrentLineWidth(width);
  };

  useEffect(() => {
    setToolSafely(Brush);
  }, []);

  return (
    <div>
      <div className="toolbar">
        <ButtonGroup>
          <button className="toolbar__btn brush" onClick={() => setToolSafely(Brush)} />
          <input type="range" min="1" max="50" value={currentLineWidth} onChange={changeLineWidth} />
          <button className="toolbar__btn eraser" onClick={() => setToolSafely(Eraser)} />
          <button className={`toolbar__btn ${currentFigure}`} onClick={() => {setIsFigureOpened(!isFigureOpened); (opacityMoreInstruments == 0) ? setOpacityMoreInstruments(1) : setOpacityMoreInstruments(0)}} />
          <button className="toolbar__btn text" onClick={() => setToolSafely(Text)}>
            <img src={TextPhoto} title="text" width={25} height={25} />
          </button>
          <input type="color" className="toolbar__btn gradient" onChange={changeColor} />
        </ButtonGroup>

        <button className="toolbar__btn undo" onClick={() => canvasState.undo(pageId)} />
        <button className="toolbar__btn redo" onClick={() => canvasState.redo(pageId)} />
        <button className="toolbar__btn save" onClick={saveAsPDF} />
      </div>

      {isFigureOpened && (
         <div className={`moreInstruments ${isFigureOpened ? "show" : "hide"}`}>
           <button
            className="toolbar__btn rect"
            onClick={() => {
              setToolSafely(Rect);
              setCurrentFigure("rect");
              setIsFigureOpened(false);
            }}
          />
          <button
            className="toolbar__btn circle"
            onClick={() => {
              setToolSafely(Circle);
              setCurrentFigure("circle");
              setIsFigureOpened(false);
            }}
          />
          <button
            className="toolbar__btn line"
            onClick={() => {
              setToolSafely(Line);
              setCurrentFigure("line");
              setIsFigureOpened(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(Toolbar);


