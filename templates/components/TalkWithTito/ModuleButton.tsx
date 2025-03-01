import { useState } from "react";

interface propsInterface {
    moduleName: string;
    onClick: () => void;
    isSelected: boolean;
}

export default function ModuleButton(props: propsInterface) {

    const [isHovered, setIsHovered] = useState(false);

    return(
        <div 
            className="hover:bg-[#AAAAAA] text-black w-[90%] max-w-full p-1 m-1 border-2 border-black rounded  hover:cursor-pointer text-xl select-none flex irish-grover"
            onClick={props.onClick}
            style={{backgroundColor: `${props.isSelected || isHovered ? "#AAAAAA" : "#EEEEEE"}`}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="pl-2">{props.moduleName}</div>
        </div>
    )
}