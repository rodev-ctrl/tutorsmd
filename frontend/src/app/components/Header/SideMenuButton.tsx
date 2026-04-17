import { Button } from "@mui/material";

import React from "react";
import { FunctionComponent } from "react";

const sideMenu = require("../../../assets/img/sideMenu.png");


type Props = {
    showSideMenu: string,
    setShowSideMenu: Function,
    setOpacityPage: Function
  }


const SideMenuButton: FunctionComponent<Props> = ({showSideMenu, setShowSideMenu, setOpacityPage}) => {
 
    return <Button
                 onClick={function() { if(showSideMenu == "hidden") {setShowSideMenu("block"); setOpacityPage("50")} else {setShowSideMenu("hidden")}   }}
                 data-modal-target="side-menu" data-modal-toggle="side-menu"
                 className="hover:cursor-pointer duration-300 my-auto"
                 style={{width: "71px", height: "71px"}}
          >
            {
               <img src={sideMenu} alt="SideMenu" width={50} height={50} />
            }
            
          </Button>
  }

  export default React.memo(SideMenuButton);