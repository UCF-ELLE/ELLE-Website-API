/* Imports */
import Image from "next/image";

/* Assets */
import cloud from "@/public/static/images/ConversAItionELLE/vocab cloud.png";
import cloud2 from "@/public/static/images/ConversAItionELLE/cloudWithText.png";


interface propsInterface {
    words: string[] | undefined;
    used: boolean[] | undefined;
}

export default function VocabList(props: propsInterface) {
    return(
        (props.words && props.used) &&
        <div className="absolute top-1 right-1 w-fit h-fit flex flex-col items-center z-2">
                <Image src={cloud2} className="" alt="Vocabulary List" />
                <div id="vocabList" className="w-[277px] bg-[#A6DAFF] border-[#8ACEFF] border-[5px] rounded p-2 mt-1 flex flex-col items-center justify-center">
                    {props.words?.map((word, index) => (
                        <div 
                        key={index}
                        style={{textDecoration: props.used?.[index] ? "line-through" : "none", fontWeight: props.used?.[index] ? "normal" : "bold"}}
                        className="break-words select-none">
                            {word}
                        </div>
                    ))}
                </div>
            </div>
    )
}