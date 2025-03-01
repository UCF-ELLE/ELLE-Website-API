interface propsInterface {
    moduleName: string;
    onClick: () => void;
}

export default function ModuleButton(props: propsInterface) {
    return(
        <div 
            className="bg-[#997c54] w-[80%] max-w-full p-1 m-1 border-2 border-black rounded irish-grover hover:bg-[#816031] hover:cursor-pointer text-lg select-none" 
            onClick={props.onClick}>
            {props.moduleName}
        </div>
    )
}