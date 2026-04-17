import { FunctionComponent, useEffect, useState } from "react";
import React from "react";

import DekstopMenu from "./DekstopMenu";
import MobileMenu from "./MobileMenu";
import { MenuItem } from "../../../interfaces/index";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/selectors";


type Props = {
    menu: MenuItem[],
    showSideMenu: string,
    setShowSideMenu: Function,
    setOpacityPage: Function,
    openModal: Function,
    isCabinetOpened: string,
    setIsCabinetOpened: (isCabinetOpened: string) => void,
    icon: string,
    openLoginedPersonCabinet: Function,
    isLoginedClientCabinetOpened: string, 
    setIsLoginedClientCabinetOpened: Function,
    isLoginedTutorCabinetOpened: string, 
    setIsLoginedTutorCabinetOpened: Function,
    scrollToBlock: Function
    
}

const Menu: FunctionComponent<Props> = ({ menu, openModal, isCabinetOpened,
     setIsCabinetOpened, isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened, isLoginedTutorCabinetOpened,
     setIsLoginedTutorCabinetOpened, icon, 
     openLoginedPersonCabinet, showSideMenu, setShowSideMenu, setOpacityPage, scrollToBlock}) => {

        const [sizeText, setSizeText] = useState<string>('text-xl');
        const [isDesktop, setIsDesktop] = useState(false);

        const user = useSelector(selectUser);

        useEffect(() => {
            // Only runs on the client
            if (typeof window !== 'undefined') {
                setIsDesktop(window.innerWidth >= 600);
            }
        }, []);
        
    if(isDesktop) {
      return <DekstopMenu 
                        sizeText={sizeText} setSizeText={setSizeText} 
                        menu={menu}
                        openModal={openModal}
                        isCabinetOpened={isCabinetOpened} setIsCabinetOpened={setIsCabinetOpened}
                        isLoginedClientCabinetOpened={isLoginedClientCabinetOpened} setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
                        isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened} setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
                        icon={icon}
                        openLoginedPersonCabinet={openLoginedPersonCabinet}
                        scrollToBlock={scrollToBlock}
                        user={user} />
       } else {
         return <MobileMenu 
                        menu={menu} 
                        showSideMenu={showSideMenu} setShowSideMenu={setShowSideMenu} 
                        setOpacityPage={setOpacityPage}
                        openModal={openModal} 
                        isCabinetOpened={isCabinetOpened} setIsCabinetOpened={setIsCabinetOpened} 
                        isLoginedClientCabinetOpened={isLoginedClientCabinetOpened} setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
                        isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened} setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
                        icon={icon}
                        openLoginedPersonCabinet={openLoginedPersonCabinet}
                        scrollToBlock={scrollToBlock}
                        user={user} />
       }
    
    }



    export default React.memo(Menu);


