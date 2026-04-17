import React, { FunctionComponent } from "react";

type Props = {
 funcClose: Function;
 funcCloseBoolean?: Function | undefined;
}

const Close: FunctionComponent<Props> = ({funcClose, funcCloseBoolean}) => {

  return (
    
                <button 
                      type="button" 
                      className="
                                text-gray-400 bg-transparent 
                                hover:bg-gray-200 hover:text-gray-900 
                                dark:hover:bg-gray-600 dark:hover:text-white
                                rounded-lg text-sm p-2 inline-flex justify-center items-center 
                                "
                onClick={() => { funcClose()}}
                style={{width: "48px", height: "48px"}}>
                    <svg className="w-8 h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span className="sr-only">Close modal</span>
                </button>


  );
}
export default React.memo(Close);


