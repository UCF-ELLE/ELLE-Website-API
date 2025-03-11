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
        <div className="absolute top-1 right-1 w-fit h-fit flex flex-col items-center">
                <Image src={cloud2} className="z-20" alt="Vocabulary List" />
                <div className="z-10 w-[277px] bg-[#A6DAFF] border-[#8ACEFF] border-[5px] rounded-bl-xl rounded-br-xl p-2 mt-1 flex flex-col items-center justify-center 
                overflow-y-auto max-h-[20em]">
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