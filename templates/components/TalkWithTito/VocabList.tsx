/* Imports */
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";
import { useState } from "react";

/* Assets */
import cloud from "@/public/static/images/ConversAItionELLE/vocab cloud.png";
import arrow from "@/public/static/images/ConversAItionELLE/Arrow.png"

interface PropsInterface {
    wordsFront: string[] | undefined;
    wordsBack: string[] | undefined;
    used: boolean[] | undefined;
}

interface WordItemProps {
    wordFront: string;
    wordBack: string;
    used: boolean;
}

/* WordItem Component */
function WordItem({ wordFront, wordBack, used }: WordItemProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                textDecoration: used ? "line-through" : "none",
                fontWeight: isHovered ? "bold" : "normal",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="break-all select-none text-center w-full"
        >
            {isHovered ? wordFront : wordBack}
        </div>
    );
}

/* VocabList Component */
export default function VocabList({ wordsFront, wordsBack, used }: PropsInterface) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!wordsFront || !wordsBack || !used) return null;

    return (
        <div className="inter-font absolute top-1 right-[-18em] w-fit h-fit flex flex-col items-center">
            <div className="relative z-20 w-[277px] h-[137px]">
                <Image src={cloud} className="absolute top-0 left-0" alt="Vocabulary List" />
                <div className="absolute top-[55%] left-[50%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap select-none flex flex-col items-center">
                    <div className="irish-grover text-2xl">Vocabulary List</div>
                    <button
                        className="p-2 rounded-full hover:scale-[1.20] transition-transform duration-300"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <Image
                            src={arrow}
                            alt={`${isExpanded ? "Minimize" : "Expand"}`}
                            style={{ transform: `${isExpanded ? "rotate(0deg)" : "rotate(180deg)"}` }}
                        />
                    </button>
                </div>
            </div>

            {/* Expanding/Collapsing List */}
            <div
            className={`absolute top-[82px] z-[19] w-[277px] bg-[#A6DAFF] border-[#8ACEFF] border-[5px] rounded-bl-xl rounded-br-xl px-2 pt-[55px] mt-1 flex flex-col items-center
            transition-all duration-300 ease-in-out overflow-hidden
            ${isExpanded ? 'h-[20em] opacity-100' : 'h-0 opacity-0'}`}
            >
                <div className="overflow-auto w-full">
                    {wordsFront
                        .map((word, index) => ({
                            wordFront: word,
                            wordBack: wordsBack[index] || "",
                            used: used[index],
                            index,
                        }))
                        .sort((a, b) => Number(a.used) - Number(b.used))
                        .map(({ wordFront, wordBack, used, index }) => (
                            <WordItem key={index} wordFront={wordFront} wordBack={wordBack} used={used} />
                        ))}
                </div>
                
            </div>
        </div>
    );
}