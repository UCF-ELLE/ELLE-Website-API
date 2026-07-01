/* Imports */
// CLEANED UP:
// - Removed large commented-out "Circular module progress tracker" JSX block (unused, dead code,
//   also reused a duplicate `id="grad"` gradient that would've conflicted with the live progress circle)
// - Removed commented-out debug console.log for masteredTermIDs/termIDs
// - Removed stale "// CHANGED:" changelog-style comments; kept the underlying explanations
//   where they document current behavior, without the outdated "CHANGED" framing
// - Removed unused `mastered` Set (built from masteredTermIDs but never referenced anywhere;
//   mastery is actually determined via usageCount >= 3 in sortedWords)
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

  // Per-word usage counts (not a simple boolean "used" flag)
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

  // Current progress for this word, shown as x/3
  usageCount: number;
  onHintClick?: (word: string) => void;
}

/* WordItem Component */
function WordItem({ wordFront, wordBack, isMastered, usageCount, onHintClick }: WordItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        fontWeight: isHovered ? "bold" : "normal",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="select-none w-full transition-all duration-300 flex items-center justify-between px-2 py-1"
    >
      {/* Only cross out the vocab word when it reaches mastery */}
      <span
        className="break-all text-center flex-1"
        style={{
          textDecoration: isMastered ? "line-through" : "none",
        }}
      >
        {isHovered ? wordFront : wordBack}
      </span>

      {/* The usage count stays normal weight, never crossed out */}
      <span className="ml-2 font-semibold whitespace-nowrap">
        {usageCount}/3
      </span>
    </div>
  );
}

/* VocabList Component */
export default function VocabList({
  wordsFront,
  wordsBack,
  usageCounts,
  progress,
  termIDs
}: PropsInterface) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!wordsFront || !wordsBack || !usageCounts || !termIDs) return null;

  // Pull usageCount for each vocab word; a word is only crossed off once usageCount >= 3
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
    <div className="inter-font w-full h-full flex flex-col items-center relative">
      {/* Cloud + Progress Circle Wrapper */}
      <div className="relative z-20 mt-2 w-[160px] md:w-[220px] lg:w-[240px] h-[85px] md:h-[115px] lg:h-[125px] flex items-center justify-center overflow-visible">
      <Image src={cloud} className="absolute top-0 left-0 w-full h-full" alt="Vocabulary List" />
      <div className="absolute top-[55%] left-[44%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap select-none flex flex-col items-center z-20">
        <div className="irish-grover text-sm md:text-xl lg:text-2xl">Vocabulary List</div>
        <button
          className="p-1 md:p-2 rounded-full hover:scale-[1.20] transition-transform duration-300"
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
              className="transition-all duration-700"
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

      {/* Expanding/Collapsing List */}
      <div
        className={`w-[210px] md:w-[220px] lg:w-[240px] bg-[#A6DAFF] border-[#8ACEFF] border-[5px] rounded-bl-xl rounded-br-xl px-2 pt-4 mt-2 flex flex-col items-center transition-all duration-300 ease-in-out overflow-hidden
        ${isExpanded ? "max-h-[20em] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="overflow-auto w-full">
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