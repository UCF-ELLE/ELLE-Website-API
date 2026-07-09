import { useState, useEffect, useRef } from "react";
import arrow from "@/public/static/images/ConversAItionELLE/Arrow.png"
import Image from "next/image";

interface ChatMessage {
    value: string;
    timestamp: string;
    source: "user" | "llm";
    metadata?: {
        score?: number;
        error?: string;
        correction?: string;
        explanation?: string;
      }
}

interface MessageProps { message: ChatMessage; chatFontSize: string; }

function Message({ message,chatFontSize }: MessageProps) {

    function scoreToRGBA(score: number): string {
        if (score <= 3) {
            // Soft red glass
            return "rgba(239, 68, 68, 0.25)"
        } else if (score <= 6) {
            // Soft yellow glass
            return "rgba(245, 158, 11, 0.25)"
        } else {
            // Soft green glass
            return "rgba(16, 185, 129, 0.25)"
        }
    }

    const { source, timestamp, value, metadata } = message;
    
    const [metadataExpanded, setMetadataExpanded] = useState<boolean>(false);

    const hasMetadata: boolean = metadata !== undefined && (
        (metadata.correction && metadata.correction.trim().length > 0) ||
        (metadata.error && metadata.error.trim().length > 0) ||
        (metadata.explanation && metadata.explanation.trim().length > 0) ||
        (metadata.score !== undefined)
    );    
    
    const fromUser: boolean = source === "user"

    const dateObj = timestamp ? new Date(timestamp) : null;
    const formattedTime: string = dateObj && !isNaN(dateObj.getTime()) 
        ? dateObj.toLocaleString([], { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
        : "";

    return (
        <div 
            className="w-full flex"
            style={{
                justifyContent: fromUser ? "end" : "start"
            }}>
            
            <div
                className="m-2 flex flex-col"
                style={{
                    alignItems: fromUser ? "flex-end" : "flex-start",
                    maxWidth: "80%"
                }}
            >

                {/*Message text div*/}
                <div
                    className={`message-bubble ${fromUser ? "message-bubble-user" : "message-bubble-llm"}`}
                    style={{
                        fontSize: `${chatFontSize}`
                    }}>
                    {value}
                </div>

                {/*Message time div / Expand metadata*/}
                <div className="text-sm w-full flex mt-1 px-1"
                    style={{
                        justifyContent: fromUser ? "end" : "start"
                    }}>
                    {(hasMetadata && fromUser) && <button onClick={() => setMetadataExpanded(!metadataExpanded)}>
                        <Image src={arrow} alt="Expand metadata" className="h-[50%] w-auto mr-1" 
                            style={{transform: !metadataExpanded ? "rotate(180deg)" : "none",}}
                        />
                    </button>}
                    {formattedTime}
                </div>

                {/*Metadata div*/}
                {(hasMetadata && metadataExpanded && fromUser && metadata !== undefined) && 
                <div 
                    className="message-metadata-card text-sm w-full flex flex-col items-start"
                    style={{backgroundColor: metadata.score !== undefined ? scoreToRGBA(metadata.score) : "transparent"}}
                    >
                    
                    {metadata.correction !== undefined && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Correction:</div>
                            {metadata.correction}
                        </div>
                    }
                    {metadata.error !== undefined && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Error:</div>
                            {metadata.error}
                        </div>
                    }
                    {metadata.explanation !== undefined && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Explanation:</div>
                            {metadata.explanation}
                        </div>
                    }
                    {metadata.score !== undefined && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Score:</div>
                            {metadata.score}
                        </div>
                    }
                </div>}
            </div>
        </div>
    );
}


interface PropsInterface {
    messages: ChatMessage[];
    chatFontSize: string;
    isThinking?: boolean;
}

export default function Messages({ messages, chatFontSize, isThinking }: PropsInterface) {

    const messagesContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = messagesContainer.current;
        if (!container) return;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    }, [messages.length, isThinking]);
    
    
    return (
        <div className="w-full h-full overflow-y-auto" ref={messagesContainer}>
            <div className="w-full flex flex-col pb-4">
                {messages.map((message, index) => (
                    <Message key={index} message={message} chatFontSize={chatFontSize}/>
                ))}
                {isThinking && (
                    <div className="w-full flex justify-start">
                        <div className="m-2 flex flex-col items-start">
                            <div className="p-3 message-bubble message-bubble-llm flex items-center gap-1.5 w-fit">
                                <span className="typing-dot bg-[#78350f]"></span>
                                <span className="typing-dot bg-[#78350f]" style={{ animationDelay: '0.2s' }}></span>
                                <span className="typing-dot bg-[#78350f]" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
