import { Tutor, Client } from "../../interfaces/index";
import { selectRole, selectUser } from "../../store/selectors";
import React, { FunctionComponent, useEffect, useState } from "react";
import { useSelector } from "react-redux";


type Props = {
  openModal: Function,
  isCabinetOpened: string,
  setIsCabinetOpened: (isCabinetOpened: string) => void,
  icon: string,
  openLoginedPersonCabinet: Function,
  isLoginedClientCabinetOpened: string,
  setIsLoginedClientCabinetOpened: Function,
  isLoginedTutorCabinetOpened: string, 
  setIsLoginedTutorCabinetOpened: Function,
  user: Client | Tutor
}



const ModalButton: FunctionComponent<Props> = ({isCabinetOpened, setIsCabinetOpened, icon, openModal, openLoginedPersonCabinet, isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, user}) => {
  

  const [widthImg, setWidthImg] = useState<string>("55px");
  const [heightImg, setHeightImg] = useState<string>("55px");

  const role = useSelector(selectRole);
  
  useEffect(() => {
     if((user?.username?.length > 0)) {
      setWidthImg("35px");
      setHeightImg("35px");
     } else {
      setWidthImg("55px");
      setHeightImg("55px");
     }
  }, [user, role])
  
  function handleClick() {
    console.log(role);
    console.log(user?.email);
    console.log(user?.email.length == 0);
    console.log(isCabinetOpened);
    if (!user?.email && role == "gast") {
      openModal(isCabinetOpened, setIsCabinetOpened);
    } else if (user?.email && role == "client") {
      openLoginedPersonCabinet(isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened);
    } else if (user?.email && role == "tutor") {
      openLoginedPersonCabinet(isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened);
    }
  };


  return  <button
  className="p-2 bg-gray-200 hover:bg-gray-300 rounded-2xl transition duration-300 
  "
  style={{width:"71px", height:"71px"}}
  onClick={() => handleClick()}
>
  <img src={icon} alt="Sign in" className="rounded-full mx-auto" width={widthImg} height={heightImg} />
  {(user && user.username) && (
    <p className="text-sm font-small text-gray-800">
      {user.username}
    </p>
  )}
</button>
}


const Cabinet:FunctionComponent<Props> = ({openModal, isCabinetOpened, setIsCabinetOpened, icon, openLoginedPersonCabinet, isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, user}) => {
   
   return <div className="h-full flex items-center justify-center" style={{height: "92px"}}>
          <ModalButton 
                    isCabinetOpened={isCabinetOpened} setIsCabinetOpened={setIsCabinetOpened} 
                    icon={icon} 
                    openModal={openModal} 
                    openLoginedPersonCabinet={openLoginedPersonCabinet} 
                    isLoginedClientCabinetOpened={isLoginedClientCabinetOpened} setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened} 
                    isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened} setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened} 
                    user={user}
          />
          
           </div>
  }

  export default React.memo(Cabinet);