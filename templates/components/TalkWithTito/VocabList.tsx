/* Imports */
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";
import { useState, useEffect } from "react";

/* Assets */
import cloud from "@/public/static/images/ConversAItionELLE/vocab cloud.png";
import arrow from "@/public/static/images/ConversAItionELLE/Arrow.png";

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
      className="break-all select-none text-center w-full transition-all duration-300"
    >
      {isHovered ? wordFront : wordBack}
    </div>
  );
}

/* VocabList Component */
export default function VocabList({ wordsFront, wordsBack, used }: PropsInterface) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!wordsFront || !wordsBack || !used) return null;

  // Fetch progress directly inside the vocab list so it stays synced
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("twt/session/getModuleProgress");
        const data = await res.json();
        if (data?.proficiencyRate !== undefined) setProgress(data.proficiencyRate);
      } catch (err) {
        console.error("Error fetching module progress:", err);
      }
    }
    fetchProgress();
  }, []);

  const sortedWords = wordsFront
    .map((word, index) => ({
      wordFront: word,
      wordBack: wordsBack[index] || "",
      used: used[index],
      index,
    }))
    .sort((a, b) => Number(a.used) - Number(b.used));

  return (
    <div className="inter-font absolute top-1 right-[-18em] w-fit h-fit flex flex-col items-center">
      {/* Cloud + Progress Circle Wrapper */}
      <div className="relative z-20 w-[277px] h-[137px] flex items-center justify-center">
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

        {/* Circular module progress tracker */}
        <div className="absolute top-[35%] left-full ml-3 flex flex-col items-center z-30">
          <div className="relative w-[70px] h-[70px]">
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                cx="35"
                cy="35"
                r="30"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="35"
                cy="35"
                r="30"
                stroke="url(#grad)"
                strokeWidth="6"
                strokeDasharray="188"
                strokeDashoffset={`${188 - (188 * progress) / 100}`}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fcd277ff" />
                  <stop offset="100%" stopColor="#fcd277ff" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm text-white font-bold drop-shadow-md">
              {progress}%
            </span>
          </div>
          <p className="mt-1 font-semibold text-white drop-shadow-md"
                        style={{fontSize: "14px"}}
          >
            Module Progress
          </p>
        </div>
      </div>

      {/* Expanding/Collapsing List */}
      <div
        className={`absolute top-[82px] z-[19] w-[277px] bg-[#A6DAFF] border-[#8ACEFF] border-[5px] rounded-bl-xl rounded-br-xl px-2 pt-[55px] mt-1 flex flex-col items-center transition-all duration-300 ease-in-out overflow-hidden
        ${isExpanded ? "h-[20em] opacity-100" : "h-0 opacity-0"}`}
      >
        <div className="overflow-auto w-full">
          {sortedWords.map(({ wordFront, wordBack, used, index }) => (
            <WordItem
              key={index}
              wordFront={wordFront}
              wordBack={wordBack}
              used={used}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
