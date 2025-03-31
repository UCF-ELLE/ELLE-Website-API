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

interface MessageProps { message: ChatMessage }
function Message({ message }: MessageProps) {

    function scoreToRGB(score: number): string {
        if (score <= 3) {
            // Red (score 0-3)
            return "rgb(214, 75, 75)"
        } else if (score <= 7) {
            // Yellow (score 4-7)
            return "rgb(214, 191, 75)"
        } else {
            // Green (score 8-10)
            return "rgb(103, 214, 75)"
        }
    }

    const { source, timestamp, value, metadata } = message;
    
    const [metadataExpanded, setMetadataExpanded] = useState<boolean>(false);

    const hasMetadata = metadata && (metadata.correction || metadata.error || metadata.explanation || metadata.score);
    const fromUser: boolean = source === "user"
    const formattedTime = timestamp ? new Date(timestamp).toLocaleString([], {hour: '2-digit', minute: '2-digit'}) : "";

    return (
        <div 
            className="w-full flex"
            style={{
                justifyContent: fromUser ? "end" : "start"
            }}>
            
            <div className="m-2 flex flex-col items-end">

                {/*Message text div*/}
                <div
                    className="p-2 rounded-lg inter-font text-lg w-fit"
                    style={{
                        backgroundColor: fromUser ? "#FCFFB4" : "#FFC9CE"
                    }}>
                    {value}
                </div>

                {/*Message time div / Expand metadata*/}
                <div className="text-sm w-full flex"
                    style={{
                        justifyContent: fromUser ? "end" : "start"
                    }}>
                    {(hasMetadata && fromUser) && <button onClick={() => setMetadataExpanded(!metadataExpanded)}>
                        <Image src={arrow} alt="Expand metadata" className="h-[50%] w-auto" 
                            style={{transform: !metadataExpanded ? "rotate(180deg)" : "none",}}
                        />
                    </button>}
                    {formattedTime}
                </div>

                {/*Metadata div*/}
                {(hasMetadata && metadataExpanded && fromUser) && 
                <div 
                    className="text-sm w-full flex flex-col items-start bg-blue-100 border border-black px-2 py-1 rounded"
                    style={{backgroundColor: metadata.score ? scoreToRGB(metadata.score) : "rgb()"}}
                    >
                    
                    {metadata.correction && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Correction:</div>
                            {metadata.correction}
                        </div>
                    }
                    {metadata.error && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Error:</div>
                            {metadata.error}
                        </div>
                    }
                    {metadata.explanation && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Explanation:</div>
                            {metadata.explanation}
                        </div>
                    }
                    {metadata.score && 
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
}

export default function Messages({ messages }: PropsInterface) {

    const messagesContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = messagesContainer.current;
        if (!container) return;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    }, [messages.length]);
    
    
    return (
        <div className="w-full h-[85%] absolute top-0 left-0 z-[11]">
            <div className="absolute w-full h-fit max-h-full overflow-auto bottom-0 left-0" ref={messagesContainer}>
                {messages.map((message, index) => (
                    <Message key={index} message={message} />
                ))}
            </div>
        </div>
    );
}
