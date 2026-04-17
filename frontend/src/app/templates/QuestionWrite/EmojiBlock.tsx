"use client";
import React, { useState, useRef, FunctionComponent, useEffect, useMemo, useCallback, Ref, RefObject } from "react";

// @ts-ignore
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';


type Props = {
    isEmojiOpened: Boolean,
    setCurentEmoji: Function,
    setNewQuestion: Function
  }


const EmojiBlock: FunctionComponent<Props> = ({isEmojiOpened, setCurentEmoji, setNewQuestion}) => {

const [visible, setVisible] = useState<string>("hidden");

const emojiBlock = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
         (isEmojiOpened) ? setVisible("block") : setVisible("hidden");
    }, [isEmojiOpened]);

    const handleEmojiSelect = (e: any) => {
        setCurentEmoji(e.native);
        setNewQuestion((prev:string) => prev + e.native);
        setVisible("hidden");
      };



      const handleClickOutside = useCallback((event: MouseEvent) => {
        if (emojiBlock.current && !emojiBlock.current.contains(event.target as Node)) {
            setVisible("hidden");
        }
      }, []);


      useEffect(() => {
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
        
      }, [handleClickOutside]);
    


  return (
  
<div ref={emojiBlock} className={`emojiBlock ${visible}`} style={{width: "352px"}}>
<Picker
      data={data}
      previewPosition="none"
      onEmojiSelect={handleEmojiSelect}
    />
</div>
  );
}



export default React.memo(EmojiBlock);