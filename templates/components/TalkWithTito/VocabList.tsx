/* Imports */
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";

/* Assets */
import cloud2 from "@/public/static/images/ConversAItionELLE/cloudWithText.png";
import { useState } from "react";

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

/* Corrected WordItem Component */
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
            {isHovered ? wordBack : wordFront}
        </div>
    );
}

/* VocabList Component */
export default function VocabList({ wordsFront, wordsBack, used }: PropsInterface) {
    if (!wordsFront || !wordsBack || !used) return null; // Handle missing data

    return (
        <div className="inter-font absolute top-1 right-1 w-fit h-fit flex flex-col items-center">
            <Image src={cloud2} className="z-20" alt="Vocabulary List" />
            <div className="z-10 w-[277px] bg-[#A6DAFF] border-[#8ACEFF] border-[5px] rounded-bl-xl rounded-br-xl p-2 mt-1 flex flex-col items-center
                overflow-y-auto max-h-[20em]">
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
    );
}
