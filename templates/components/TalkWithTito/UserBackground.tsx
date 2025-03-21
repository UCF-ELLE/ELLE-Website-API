import { useEffect, useState } from "react";
import Image from "next/image";

interface propsInterface {
    username?: string;
    backgroundFilepath?: string;
}

export default function Settings(props: propsInterface) {

    const [backgroundImage, setBackgroundImage] = useState<string>();

    //Loads in image
    useEffect(() => {
        if(!props.backgroundFilepath) return;
        const loadBackground = async () => {
            const image = await import(`@/public/static/images/ConversAItionELLE/UserBackgrounds/${props.backgroundFilepath}`);
            setBackgroundImage(image);
        };
        loadBackground();
    }, [props.backgroundFilepath])

    // Separate effect to log the updated state
    useEffect(() => {
        if (backgroundImage) {
        console.log("Background Image URL:", backgroundImage);
        }
    }, [backgroundImage]);
    

    return(
        <div 
        className="relative w-full h-fit min-h-[28.34%] flex items-center justify-center irish-grover md:text-2xl border-b-2 border-white">
            {backgroundImage && <Image src={backgroundImage} className="" alt={`${props.backgroundFilepath}`}/>}
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">{props.username ? props.username : "<username>"}</div>
            
        </div>
    )
}