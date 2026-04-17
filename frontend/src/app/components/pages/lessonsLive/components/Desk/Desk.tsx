"use client";

import React, {
  FunctionComponent,
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./Desk.css";

import Toolbar from "../Toolbar";
import Canvas from "../Canvas";
import DeskService from "../../../../../services/DeskService";
import canvasState from "../../../../../store/canvasState";
import { Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../store/selectors";

/* ====================== TYPES ====================== */

type Props = {
  randomLessonId: string;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  socket: Socket | null;
  activeCanvasIndex: number;
  setActiveCanvasIndex: (n: number) => void;
};

type Page = { id: number; ref: RefObject<HTMLCanvasElement> };

/* ====================== COMPONENT ====================== */

const Desk: FunctionComponent<Props> = ({
  randomLessonId,
  canvasRef,
  socket,
  activeCanvasIndex,
  setActiveCanvasIndex,
}) => {

  const user = useSelector(selectUser);

  const [pages, setPages] = useState<Page[]>([
    { id: 0, ref: React.createRef<HTMLCanvasElement>() },
  ]);

  const [inputValue, setInputValue] = useState("1");
  const mouseUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHashRef = useRef<Record<number, string>>({});


  function hashDataUrl(dataUrl: string): string {
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  /* ====================== SAVE PNG ====================== */

  const savePNG = useCallback(
    async (pageIndex: number) => {
      const canvas = pages[pageIndex]?.ref.current;
      if (!canvas) return;

      try {
        const dataUrl = canvas.toDataURL("image/png", 0.8);
        const hash = hashDataUrl(dataUrl);

        if (lastHashRef.current[pageIndex] === hash) return; // ⛔ ничего не изменилось

        lastHashRef.current[pageIndex] = hash;


        await DeskService.deskSave(randomLessonId, { current: canvas }, pageIndex);
        
      } catch (e) {
        console.error("PNG save failed:", e);
      }
    },
    [pages, randomLessonId]
  );

  /* ====================== GLOBAL AUTOSAVE ====================== */

  useEffect(() => {
    const interval = setInterval(() => {
      Object.entries(canvasState.dirtyPages).forEach(([pageId, dirty]) => {
        if (dirty) {
          savePNG(Number(pageId));
          canvasState.dirtyPages[Number(pageId)] = false;
        }
      });
    }, 60000); 

    return () => clearInterval(interval);
  }, [savePNG]);

  /* ====================== LOAD DESK PAGE ====================== */

  useEffect(() => {
    async function loadDesk() {
      try {
        const res = await DeskService.getDesk(
          randomLessonId,
          activeCanvasIndex
        );

        const img = res.data?.img;
        const canvas = canvasRef.current;

        if (!canvas || !img) {
          canvasState.setSnapshot(activeCanvasIndex, null);
          //canvasState.actionHistory[activeCanvasIndex] = [];
          //canvasState.redoStack[activeCanvasIndex] = [];
          return;
        }

        const image = new Image();
        image.src = img;

        image.onload = () => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);
        };

        canvasState.setSnapshot(activeCanvasIndex, image);
        //canvasState.actionHistory[activeCanvasIndex] = [];
        //canvasState.redoStack[activeCanvasIndex] = [];
      } catch (e) {
        console.error("Desk load error:", e);
      }
    }

    loadDesk();
  }, [activeCanvasIndex, randomLessonId]);

  /* ====================== MOUSE UP SAVE ====================== */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseUp = () => {
      canvasState.dirtyPages[activeCanvasIndex] = true;

      if (mouseUpTimer.current) clearTimeout(mouseUpTimer.current);

      mouseUpTimer.current = setTimeout(() => {
        savePNG(activeCanvasIndex);
        canvasState.dirtyPages[activeCanvasIndex] = false;
      }, 400);
    };

    canvas.addEventListener("mouseup", onMouseUp);
    return () => canvas.removeEventListener("mouseup", onMouseUp);
  }, [activeCanvasIndex, savePNG]);

  /* ====================== ENSURE PAGE ====================== */

  const ensurePageExists = (index: number) => {
    if (index < pages.length) return;

    setPages((prev) => {
      const copy = [...prev];
      for (let i = prev.length; i <= index; i++) {
        copy.push({ id: i, ref: React.createRef<HTMLCanvasElement>() });
      }
      return copy;
    });
  };

  /* ====================== PAGE NAV ====================== */

  const changePage = (nextIndex: number) => {
    canvasState.dirtyPages[activeCanvasIndex] = true;
    savePNG(activeCanvasIndex);

    ensurePageExists(nextIndex);
    setActiveCanvasIndex(nextIndex);
    setInputValue(String(nextIndex + 1));
  };

  const prevPage = () => {
    if (activeCanvasIndex === 0) return;
    changePage(activeCanvasIndex - 1);
  };

  const nextPage = () => {
    changePage(activeCanvasIndex + 1);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const idx = Number(val) - 1;
    if (Number.isNaN(idx) || idx < 0) return;
    changePage(idx);
  };

  /* ====================== INIT CANVAS ====================== */

  useEffect(() => {
    const current = pages[activeCanvasIndex]?.ref.current;
    if (!current) return;

    const rect = current.getBoundingClientRect();
    current.width = rect.width;
    current.height = rect.height;

    canvasRef.current = current;
    canvasState.setCanvas(current, activeCanvasIndex);
  }, [pages, activeCanvasIndex]);

  /* ====================== SOCKET INIT ====================== */

  useEffect(() => {
    if (!socket || !user?.email) return;

    canvasState.initSocket(socket, randomLessonId, user?.email);
    socket.emit("joinBoard", { lessonId: randomLessonId });
  }, [socket, randomLessonId, user?.email]);
  

  /* ====================== RENDER ====================== */

  return (
    <div className="canvas">
      {/* Navigation */}
      <div className="navigation-buttons">
        <button onClick={prevPage} disabled={activeCanvasIndex === 0}>
          ◀
        </button>

        <input
          type="number"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          min={1}
        />

        <button onClick={nextPage}>▶</button>
      </div>

      <Toolbar
        canvasRef={pages[activeCanvasIndex]?.ref}
        pageId={activeCanvasIndex}
      />

      {pages[activeCanvasIndex] && (
        <Canvas
          key={pages[activeCanvasIndex].id}
          canvasRef={pages[activeCanvasIndex].ref}
          pageId={pages[activeCanvasIndex].id}
          socket={socket}
          style={{ display: "block" }}
        />
)}

    </div>
  );
};

export default React.memo(Desk);
