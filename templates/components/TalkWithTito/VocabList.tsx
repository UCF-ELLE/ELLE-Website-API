/* Imports */
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";
import { useState } from "react";
import { useId } from "react";

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
  const progressGradientId = useId();

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
      <div className="absolute top-[55%] left-[44%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap select-none flex flex-col items-center z-20">
        <div className="irish-grover text-sm md:text-xl lg:text-2xl">Vocabulary List</div>
        <button
          className="vocab-expand-button p-1 md:p-2 rounded-full hover:scale-[1.20] transition-transform duration-300"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Image
            src={arrow}
            alt={`${isExpanded ? "Minimize" : "Expand"}`}
            style={{ transform: `${isExpanded ? "rotate(0deg)" : "rotate(180deg)"}` }}
          />
        </button>
      </div>

      <div className="absolute top-[70%] right-[22px] md:right-[24px] lg:right-[26px] -translate-y-1/2 flex items-center justify-center z-40">
        <div className="relative w-[32px] h-[32px] md:w-[42px] md:h-[42px]">
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="17"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="21"
              cy="21"
              r="17"
              stroke={`url(#${progressGradientId})`}
              strokeWidth="4"
              strokeDasharray="107"
              strokeDashoffset={`${107 - (107 * progress) / 100}`}
              strokeLinecap="round"
              fill="none"
              className="vocab-progress-ring transition-all duration-700"
            />
            <defs>
            <linearGradient id={progressGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fcd277ff" />
                <stop offset="100%" stopColor="#fcd277ff" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs text-black font-bold">
            {progress}%
          </span>
        </div>
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