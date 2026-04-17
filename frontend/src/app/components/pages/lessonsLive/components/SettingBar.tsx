"use client"
"use strict"

import './SettingBar.css';
import toolState from '../../../../store/toolState';
import React from 'react';

const SettingBar = () => {
  return (
    <div className="setting-bar">
        <input
           // Изменение толщины линию в зависимости от введенного значения
              onChange={e => toolState.setLineWidth(Number(e.target.value))} 

              type="number" 
              defaultValue={1} 
              min={1} max={50}
              style={{margin: '0 10px'}}
              id="line-width" 
        />
        <input 
              onChange={e => toolState.setStrokeColor(e.target.value)}
              type="color" 
              name="" 
              id="stroke-color" 
        />

    </div>
  );
}

export default React.memo(SettingBar);
