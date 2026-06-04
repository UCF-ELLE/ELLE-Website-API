import { useState } from "react";

interface propsInterface {
    moduleName: String;
    onClick: () => void;
    isSelected: boolean;
}

export default function ModuleButton(props: propsInterface) {

    const [isHovered, setIsHovered] = useState(false);

    return(
        <div 
            className="hover:bg-[#AAAAAA] text-black w-[90%] max-w-full p-1.5 m-1 border-2 border-black rounded hover:cursor-pointer text-lg select-none flex justify-between items-center irish-grover transition-all duration-200"
            onClick={props.onClick}
            style={{backgroundColor: `${props.isSelected || isHovered ? "#AAAAAA" : "#EEEEEE"}`}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="pl-2 truncate pr-2">{props.moduleName}</div>
            <div 
                className="pr-2 text-xs text-black/55 transition-transform duration-200"
                style={{ transform: props.isSelected ? 'rotate(180deg)' : 'none' }}
            >
                ▼
            </div>
        </div>
    )
}