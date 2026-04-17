"use strict";
import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';
import Home from './app/Main.tsx';
import { LanguageProvider } from "./app/context/LanguageContext.tsx";
//import reportWebVitals from './reportWebVitals.ts';
import "./output.css";

const rootSrc = document.getElementById('root');

if(rootSrc) {
    const root = ReactDOM.createRoot(rootSrc);
    console.log("Parent for home");
    root.render(
        <LanguageProvider>
            <Home />
        </LanguageProvider>
    
    );
}


//reportWebVitals();
