// Undo / Redo / Save - через useRef + useReducer

import { useEffect, useRef, useReducer, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import { io, Socket } from 'socket.io-client';

// ─── Types ────────────────────────────────────────────────────
type Tool = 'brush' | 'erase' | 'line' | 'rect' | 'circle' | 'text';

interface ToolState {
  tool:      Tool;
  color:     string;
  lineWidth: number;
}

interface DrawAction {
  type: Tool;
  data: any;
}

interface WSAction extends DrawAction {
  userId: string;
}

// ─── Reducer ─────────────────────────────────────────────────
const toolReducer = (state: ToolState, patch: Partial<ToolState>): ToolState =>
  ({ ...state, ...patch });

const initialTool: ToolState = { tool: 'brush', color: '#000000', lineWidth: 3 };

// ─── Component ───────────────────────────────────────────────
export const Whiteboard = ({ lessonId }: { lessonId: string }) => {
  const userId    = useSelector(selectUserId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // История действий — для undo/redo
  const history  = useRef<DrawAction[]>([]);
  const redoStack = useRef<DrawAction[]>([]);

  // Состояние рисования
  const drawing  = useRef(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const points   = useRef<{ x: number; y: number }[]>([]);
  // Снапшот перед началом rect/circle/line — для превью
  const snapshot = useRef<ImageData | null>(null);

  const [toolState, dispatch] = useReducer(toolReducer, initialTool);

  // ─── Canvas helpers ─────────────────────────────────────────
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const getPos = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  // ─── Apply single action to canvas ──────────────────────────
  const applyAction = useCallback((action: DrawAction) => {
    const ctx = getCtx();
    if (!ctx) return;

    const { type, data } = action;
    ctx.save();

    switch (type) {
      case 'brush':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = data.color;
        ctx.lineWidth   = data.lineWidth;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        data.points.forEach((p: any, i: number) => {
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        break;

      case 'erase':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = data.lineWidth;
        ctx.lineCap   = 'round';
        ctx.beginPath();
        data.points.forEach((p: any, i: number) => {
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        break;

      case 'line':
        ctx.strokeStyle = data.color;
        ctx.lineWidth   = data.lineWidth;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(data.x1, data.y1);
        ctx.lineTo(data.x2, data.y2);
        ctx.stroke();
        break;

      case 'rect':
        ctx.strokeStyle = data.color;
        ctx.fillStyle   = data.fill ?? 'transparent';
        ctx.lineWidth   = data.lineWidth;
        ctx.beginPath();
        ctx.rect(data.x, data.y, data.width, data.height);
        ctx.stroke();
        break;

      case 'circle': {
        const rx = Math.abs(data.width)  / 2;
        const ry = Math.abs(data.height) / 2;
        const cx = data.x + (data.width)  / 2;
        const cy = data.y + (data.height) / 2;
        ctx.strokeStyle = data.color;
        ctx.lineWidth   = data.lineWidth;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'text':
        ctx.font      = `${data.fontSize ?? 18}px Arial`;
        ctx.fillStyle = data.color;
        ctx.fillText(data.text, data.x, data.y);
        break;
    }

    ctx.restore();
  }, []);

  // ─── Redraw all history ──────────────────────────────────────
  const redraw = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history.current.forEach(applyAction);
  }, [applyAction]);

  // ─── Socket.IO ───────────────────────────────────────────────
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
      withCredentials: true,
      auth: { token: tokenManager.get() },
    });
    socketRef.current = socket;

    socket.emit('board:join', { lessonId });

    socket.on('board:action', (action: WSAction) => {
      if (action.userId === userId) return;
      history.current.push(action);
      redoStack.current = [];
      applyAction(action);
    });

    socket.on('board:fullState', (actions: DrawAction[]) => {
      history.current  = actions;
      redoStack.current = [];
      redraw();
    });

    return () => { socket.disconnect(); };
  }, [lessonId, userId, applyAction, redraw]);

  // ─── Pointer events ─────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    drawing.current = true;
    const pos = getPos(e);
    startPos.current = pos;
    points.current = [pos];

    // Сохраняем снапшот для shape preview
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas &&
      ['line', 'rect', 'circle'].includes(toolState.tool)) {
      snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const pos = getPos(e);
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const { tool, color, lineWidth } = toolState;

    if (tool === 'brush' || tool === 'erase') {
      points.current.push(pos);
      // Рисуем только последний сегмент для производительности
      applyAction({
        type: tool,
        data: { points: points.current.slice(-2), color, lineWidth },
      });
    }

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      // Restore snapshot для чистого preview
      if (snapshot.current) {
        ctx.putImageData(snapshot.current, 0, 0);
      }
      const { x: x1, y: y1 } = startPos.current;

      if (tool === 'line') {
        applyAction({ type: 'line', data: { x1, y1, x2: pos.x, y2: pos.y, color, lineWidth } });
      }
      if (tool === 'rect') {
        applyAction({ type: 'rect', data: {
          x: x1, y: y1, width: pos.x - x1, height: pos.y - y1, color, lineWidth,
        }});
      }
      if (tool === 'circle') {
        applyAction({ type: 'circle', data: {
          x: x1, y: y1, width: pos.x - x1, height: pos.y - y1, color, lineWidth,
        }});
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    drawing.current = false;
    const pos = getPos(e);
    const { tool, color, lineWidth } = toolState;

    let action: DrawAction | null = null;

    if (tool === 'brush' || tool === 'erase') {
      action = { type: tool, data: { points: [...points.current], color, lineWidth } };
    }
    if (tool === 'line') {
      action = { type: 'line', data: {
        x1: startPos.current.x, y1: startPos.current.y,
        x2: pos.x, y2: pos.y, color, lineWidth,
      }};
    }
    if (tool === 'rect') {
      action = { type: 'rect', data: {
        x: startPos.current.x, y: startPos.current.y,
        width: pos.x - startPos.current.x,
        height: pos.y - startPos.current.y,
        color, lineWidth,
      }};
    }
    if (tool === 'circle') {
      action = { type: 'circle', data: {
        x: startPos.current.x, y: startPos.current.y,
        width: pos.x - startPos.current.x,
        height: pos.y - startPos.current.y,
        color, lineWidth,
      }};
    }

    if (action) {
      history.current.push(action);
      redoStack.current = [];
      socketRef.current?.emit('board:action', { lessonId, ...action, userId });
    }

    points.current  = [];
    snapshot.current = null;
  };

  // Текст — по клику
  const onDoubleClick = (e: React.MouseEvent) => {
    if (toolState.tool !== 'text') return;
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top)  * (canvas.height / rect.height);

    const text = window.prompt('Text eingeben:');
    if (!text) return;

    const action: DrawAction = {
      type: 'text',
      data: { text, x, y, color: toolState.color, fontSize: 18 },
    };
    applyAction(action);
    history.current.push(action);
    redoStack.current = [];
    socketRef.current?.emit('board:action', { lessonId, ...action, userId });
  };

  // ─── Undo / Redo ─────────────────────────────────────────────
  const undo = () => {
    if (!history.current.length) return;
    const last = history.current.pop()!;
    redoStack.current.push(last);
    redraw();
    socketRef.current?.emit('board:undo', { lessonId, userId });
  };

  const redo = () => {
    if (!redoStack.current.length) return;
    const next = redoStack.current.pop()!;
    history.current.push(next);
    applyAction(next);
    socketRef.current?.emit('board:redo', { lessonId, action: next, userId });
  };

  // ─── Save ─────────────────────────────────────────────────────
  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${lessonId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ─── Render ───────────────────────────────────────────────────
  const TOOLS: { id: Tool; label: string }[] = [
    { id: 'brush',  label: '🖊' },
    { id: 'erase',  label: '⬜' },
    { id: 'line',   label: '╱' },
    { id: 'rect',   label: '▭' },
    { id: 'circle', label: '○' },
    { id: 'text',   label: 'T' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900">

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-700 flex-wrap">

        {/* Tool buttons */}
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => dispatch({ tool: t.id })}
            title={t.id}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition flex items-center
              justify-center
              ${toolState.tool === t.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            {t.label}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-600 mx-0.5" />

        {/* Color */}
        <input
          type="color"
          value={toolState.color}
          onChange={(e) => dispatch({ color: e.target.value })}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
          title="Farbe"
        />

        {/* Line width */}
        <input
          type="range" min={1} max={24}
          value={toolState.lineWidth}
          onChange={(e) => dispatch({ lineWidth: Number(e.target.value) })}
          className="w-16 accent-blue-500"
          title="Stärke"
        />

        <div className="w-px h-5 bg-gray-600 mx-0.5" />

        {/* Undo */}
        <button onClick={undo}
          className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700
            transition flex items-center justify-center text-sm"
          title="Rückgängig (Undo)">
          ↩
        </button>

        {/* Redo */}
        <button onClick={redo}
          className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700
            transition flex items-center justify-center text-sm"
          title="Wiederholen (Redo)">
          ↪
        </button>

        {/* Save */}
        <button onClick={save}
          className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700
            transition flex items-center justify-center text-sm ml-auto"
          title="Als PNG speichern">
          💾
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={800}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={onDoubleClick}
        className="flex-1 w-full bg-white cursor-crosshair touch-none"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
