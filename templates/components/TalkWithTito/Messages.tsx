import { useState } from "react";
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

interface MessageProps { message: ChatMessage } // Makes react happy (something about props and typing idk)
function Message({ message }: MessageProps) {

    const [metadataExpanded, setMetadataExpanded] = useState<boolean>(false);

    const fromUser: boolean = message.source === "user";
    let timeHours: number | null = null;
    let timeMinutes: number | null = null;
    let formattedTime: string = "";

    if (message.timestamp !== "") {
        const timestampObject: Date = new Date(message.timestamp);
        timeHours = timestampObject.getHours();
        timeMinutes = timestampObject.getMinutes();
        formattedTime = `${timeHours % 12 || 12}:${timeMinutes < 10 ? `0${timeMinutes}` : timeMinutes} ${timeHours >= 12 ? "PM" : "AM"}`
    }

    return (
        <div 
            className="w-full flex"
            style={{
                justifyContent: fromUser ? "end" : "start"
            }}>
            
            <div className="m-2 flex flex-col">

                {/*Message text div*/}
                <div
                    className="p-2 rounded-lg inter-font text-lg"
                    style={{
                        backgroundColor: fromUser ? "#FCFFB4" : "#FFC9CE"
                    }}>
                    {message.value}
                </div>

                {/*Message time div / Expand metadata*/}
                <div className="text-sm w-full flex"
                    style={{
                        justifyContent: fromUser ? "end" : "start"
                    }}>
                    {message.metadata && <button className=" " onClick={() => setMetadataExpanded(!metadataExpanded)}>
                        <Image src={arrow} alt="Expand metadata" className="h-[50%] w-auto" 
                            style={{transform: !metadataExpanded ? "rotate(180deg)" : "none",}}
                        />
                    </button>}
                    {formattedTime}
                </div>

                {/*Metadata div*/}
                {(message.metadata && metadataExpanded) && <div className="text-sm w-full flex flex-col items-end bg-gray-100 border border-black px-2 py-1 rounded">
                    {message.metadata.correction && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Correction:</div>
                            {message.metadata.correction}
                        </div>
                    }
                    {message.metadata.error && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Error:</div>
                            {message.metadata.error}
                        </div>
                    }
                    {message.metadata.explanation && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Explanation:</div>
                            {message.metadata.explanation}
                        </div>
                    }
                    {message.metadata.score && 
                        <div className="flex flex-row">
                            <div className="font-bold mr-1">Score:</div>
                            {message.metadata.score}
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
    const testData: ChatMessage[] = [];
    return (
        <div className="w-full h-[85%] absolute top-0 left-0 z-[11]">
            <div className="absolute w-full h-fit max-h-full overflow-auto bottom-0 left-0">
                {(messages[0] ? messages : testData).map((message, index) => (
                    <Message key={index} message={message} />
                ))}
            </div>
        </div>
    );
}
