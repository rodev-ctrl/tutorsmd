"use client";
import { useState, FunctionComponent, useEffect, useRef, RefObject } from "react";

import { Button } from "@mui/material";
import { Link, animateScroll as scroll } from "react-scroll";
import { useDispatch, useSelector } from "react-redux";

import "../styles/Prices.css";
import React from "react";



type TimeType = {
    id: number,
    name: string
  }

  type Props = {
     price: TimeType,
     Sum: Function,
     setCopyName: Function,
     copyName: string,
     refParent: RefObject<HTMLDivElement>
  }
  
  


const Price = ({price, Sum, setCopyName, copyName, refParent}: Props): JSX.Element => {

  
 const {name}: TimeType = price;

 const [classNameDiv, setClassnameDiv] = useState("price border border-2 border-gray rounded-lg m-2 mx-auto w-3/4");
 const ref = useRef<null | HTMLDivElement>(null);



 function div() {
  
  if(name == "Месяц" || name == "Monat") {
    setClassnameDiv(classNameDiv + " col-span-2 active");
  }
       
    else {
      setClassnameDiv("price border border-2 border-gray rounded-lg m-2 mx-auto w-3/4"); 
    }
      
  
 }

 useEffect(() => {div()}, [])



  return (
  <div ref={ref} className={classNameDiv}>   

        <Button 
             
             className="w-full" 
             color="primary" 
             onClick={() => {setCopyName(name);
              if(refParent.current) 
              for(let i = 0; i < refParent.current.children.length; i++) {
                for(let j = 0; j < refParent.current.children[i].classList.length; j++) {
                  if(refParent.current.children[i].classList[j].includes("active")) {
                     // refParent.current.children[i].classList.replace("active", "");
                     // refParent.current.children[i].classList[j].remove();
                     refParent.current.children[i].classList.value = refParent.current.children[i].classList.value.replace("active", "");
                  }
                }
                 
              }
              
          // setClassnameDiv(classNameDiv + " active");
          if(ref.current)
          ref.current.classList.value += " active";
          
          }
          
          }
          
          >{name}</Button>
  
  </div>
  );
}


export default React.memo(Price);
