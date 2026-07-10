/* Imports */
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";
import { useState } from "react";

/* Assets */
import cloud from "@/public/static/images/ConversAItionELLE/vocab cloud.png";
import arrow from "@/public/static/images/ConversAItionELLE/Arrow.png";

interface PropsInterface {
  wordsFront: string[] | undefined;
  wordsBack: string[] | undefined;

  // CHANGED: use per-word usage counts instead of boolean used values
  usageCounts: number[] | undefined;

  progress: number;
  termIDs: number[];
  masteredTermIDs?: number[];
  onHintClick?: (word: string) => void;
  onReset?: () => void;
}

interface WordItemProps {
  wordFront: string;
  wordBack: string;
  isMastered: boolean;

  // CHANGED: pass each word's current progress so we can show x/3
  usageCount: number;
  onHintClick?: (word: string) => void;
}

/* Star Rating Component */
function StarRating({ count }: { count: number }) {
  const stars = [];
  for (let i = 1; i <= 3; i++) {
    const isFilled = i <= count;
    stars.push(
      <svg
        key={i}
        className={`w-[18px] h-[18px] transition-all duration-300 ${
          isFilled 
            ? (count >= 3 ? "text-amber-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)] scale-110" : "text-amber-500") 
            : "text-slate-500/70"
        }`}
        fill={isFilled ? "currentColor" : "none"}
        stroke={isFilled ? "none" : "currentColor"}
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

/* WordItem Component */
function WordItem({ wordFront, wordBack, isMastered, usageCount, onHintClick }: WordItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="select-none w-full transition-all duration-200 flex items-center justify-between px-2 py-1.5 border-b border-white/20 last:border-b-0 hover:bg-white/25 rounded-md"
    >
      <span
        className={`break-all flex-1 text-left font-semibold text-xs md:text-sm transition-all duration-200 ${
          isMastered 
            ? "line-through text-slate-500/80 opacity-60" 
            : "text-slate-800"
        }`}
      >
        {isHovered ? wordFront : wordBack}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <StarRating count={usageCount} />
        {!isMastered && onHintClick ? (
          <button
            onClick={() => onHintClick(wordBack)}
            className="w-[26px] h-[26px] hover:scale-[1.25] transition-transform duration-200 text-sm cursor-pointer bg-white/40 hover:bg-white/70 border border-white/60 rounded-full flex items-center justify-center shadow-sm shrink-0"
            title={`Ask Tito for a hint about ${wordBack}`}
          >
            💡
          </button>
        ) : (
          <div className="w-[26px] h-[26px] shrink-0" />
        )}
      </div>
    </div>
  );
}

/* VocabList Component */
export default function VocabList({
  wordsFront,
  wordsBack,
  usageCounts,
  progress,
  termIDs,
  masteredTermIDs,
  onHintClick,
  onReset
}: PropsInterface) {
  const [isExpanded, setIsExpanded] = useState(false);

  const mastered = new Set(masteredTermIDs ?? []);
  //console.log("[VocabList] masteredTermIDs =", masteredTermIDs, "termIDs =", termIDs);
  // CHANGED: check usageCounts instead of used
  if (!wordsFront || !wordsBack || !usageCounts || !termIDs) return null;

  // CHANGED:
  // - pull usageCount for each vocab word
  // - only cross off the vocab word when usageCount >= 3

  const sortedWords = wordsFront
    .map((word, index) => {
      const usageCount = usageCounts[index] ?? 0;
      const isCrossedOff = usageCount >= 3;
      return {
        wordFront: wordsBack[index] || "",
        wordBack: word,
        usageCount,
        isMastered: isCrossedOff,
        index,
      };
    })
    .sort((a, b) => Number(a.isMastered) - Number(b.isMastered));

  return (
    <div className="inter-font w-full h-auto lg:h-full flex flex-col items-center relative">
      {/* Cloud + Progress Circle Wrapper */}
      <div className="relative z-20 mt-0 w-[240px] md:w-[260px] lg:w-[290px] h-[115px] md:h-[125px] lg:h-[135px] flex items-center justify-center overflow-visible">
      <Image src={cloud} className="absolute top-0 left-0 w-full h-full" alt="Vocabulary List" />
      <div className="absolute top-[52%] left-[48%] -translate-x-1/2 -translate-y-1/2 select-none flex flex-col items-center z-20 w-[80%]">
        <div className="irish-grover text-sm md:text-xl lg:text-2xl text-center">Vocabulary List</div>
        
        {/* Rainbow Progress Bar */}
        <div className="mt-1 md:mt-2 flex items-center gap-2 w-full justify-center">
          <div className="w-[150px] md:w-[180px] h-[12px] md:h-[16px] bg-black/15 rounded-full overflow-hidden border border-white/40 shadow-inner relative shrink-0">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="w-[150px] md:w-[180px] h-full bg-[linear-gradient(90deg,#ff5e62_0%,#ff9966_8%,#ffdb00_15%,#38ef7d_45%,#00f2fe_75%,#9c27b0_100%)] relative">
                {/* Diagonal Candy Stripe Texture */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.15)_0px,rgba(255,255,255,0.15)_8px,transparent_8px,transparent_16px)]" />
                {/* Shiny Glossy Highlight */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_100%)]" />
              </div>
            </div>
          </div>
          <span className="text-[10px] md:text-xs text-slate-800 font-bold shrink-0">
            {progress}%
          </span>
        </div>

        <button
          className="vocab-expand-button p-1 md:p-2 rounded-full hover:scale-[1.20] transition-transform duration-300 mt-0.5 md:mt-1"
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

      {/* Circular module progress tracker */}
      {/* 
        <div className="absolute top-[35%] left-full ml-0 md:ml-1 lg:ml-2 flex flex-col items-center z-30">
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
          <p
            className="mt-1 font-semibold text-white drop-shadow-md"
            style={{ fontSize: "14px" }}
          >
            Module Progress
          </p>
        </div>
      */}

      {/* Expanding/Collapsing List */}
      <div
        className={`vocab-list-container flex flex-col items-center ease-in-out overflow-hidden
        ${isExpanded ? "vocab-list-open" : "vocab-list-closed"}`}
      >
        <div className="overflow-auto w-full pr-3">
          {/* CHANGED: pass usageCount into each WordItem */}
          {sortedWords.map(({ wordFront, wordBack, usageCount, isMastered, index }) => (
            <WordItem
              key={index}
              wordFront={wordFront}
              wordBack={wordBack}
              usageCount={usageCount}
              isMastered={isMastered}
              onHintClick={onHintClick}
            />
          ))}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="mt-2 mb-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition self-center"
            title="Reset progress for this module"
          >
            Reset List
          </button>
        )}
      </div>
  </div>
  );
}