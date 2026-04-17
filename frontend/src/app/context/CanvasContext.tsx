import React, { createContext, useContext, useRef, useEffect, useState, ReactNode } from "react";
import CanvasState from "../store/canvasState";

interface CanvasContextType {
    canvasState: CanvasState | null;
    setCanvasState: React.Dispatch<React.SetStateAction<CanvasState | null>>;
    canvasRef: React.RefObject<HTMLCanvasElement>; // Добавляем canvasRef в контекст
    pageId: number; // ID страницы
    setPageId: React.Dispatch<React.SetStateAction<number>>;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

interface CanvasProviderProps {
    children: ReactNode;
    pageId: number; // ID страницы
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children, pageId }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvasState, setCanvasState] = useState<CanvasState | null>(null);
    const [currentPageId, setCurrentPageId] = useState(pageId); // ID страницы

    useEffect(() => {
        if (canvasState && canvasRef.current) {
           // const newState = new canvasState(canvasRef.current, currentPageId); // Передаем canvasRef и pageId в CanvasState
           // setCanvasState(newState);

            return () => {
             //   newState.destroyEvents?.();
            };
        }
    }, [canvasRef, currentPageId]); // Добавляем currentPageId в зависимости

    const value = { canvasState, setCanvasState, canvasRef, pageId: currentPageId, setPageId: setCurrentPageId };

    return (
        <CanvasContext.Provider value={value}>
            {children}
        </CanvasContext.Provider>
    );
};

export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error("useCanvas must be used within a CanvasProvider");
    }
    return context;
};