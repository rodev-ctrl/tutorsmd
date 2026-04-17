import React, {
  CSSProperties,
  RefObject,
  useEffect,
  FunctionComponent,
} from "react";

import "../instruments/styles/canvas.css";
import canvasState from "../../../../store/canvasState";
import { observer } from "mobx-react-lite";
import { Socket } from "socket.io-client";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement>;
  style: CSSProperties;
  pageId: number;
  socket: Socket | null;
};

const Canvas: FunctionComponent<Props> = observer(
  ({ canvasRef, style, pageId, socket }) => {
    /** Инициализация canvas размера */
    /*
    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;

      // фиксируем размеры
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // регистрация в canvasState
      canvasState.setCanvas(canvas, pageId);
    }, [canvasRef, pageId]);
    */

    
    

    return (
      <div className="canvasPaint" style={style}>
        <canvas
          style={{
            width: "100%",
            height: "600px",
            maxWidth: "1800px",
            maxHeight: "600px",
          }}
          ref={canvasRef}
        ></canvas>
      </div>
    );
  }
);

export default React.memo(Canvas);
