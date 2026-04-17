import React from "react";

type Text = {
    highlight: string | undefined,
    fulldescribe: string | undefined
}

function Text({highlight, fulldescribe}:Text) {
    return (
        <div>
<h6 className="highlight text-xl text-bold text-center mt-5 truncate" style={{color: "rgb(16, 14, 138)"}}>
        {highlight}
</h6>
        
                     <p className="fullDescribe text-center truncate">
                  {fulldescribe}...
                     </p>
        </div>
        
    )
}

export default React.memo(Text);