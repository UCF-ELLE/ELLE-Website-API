interface ChatMessage {
    value: string;
    timestamp: string;
    source: "user" | "llm";
}

interface MessageProps { message: ChatMessage } // Makes react happy (something about props and typing idk)
function Message({ message }: MessageProps) {
    const fromUser: boolean = message.source === "user";
    const timestampObject: Date = new Date(message.timestamp);
    const timeHours: number = timestampObject.getHours();
    const timeMinutes: number = timestampObject.getMinutes();
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

                {/*Message time div*/}
                <div className="text-sm w-full flex"
                style={{
                    justifyContent: fromUser ? "end" : "start"
                }}>
                    {timeHours % 12 + ":" + timeMinutes + ` ${timeHours > 12 ? "PM" : "AM"}`}
                </div>

            </div>
        </div>
    );
}

interface PropsInterface {
    messages: ChatMessage[];
}

export default function Messages({ messages }: PropsInterface) {
    const testData: ChatMessage[] = [
        {
            value: "Hey, how are you?",
            timestamp: "2025-03-19T10:15:30Z",
            source: "user"
        },
        {
            value: "I'm just a chatbot, but I'm here to help! What can I do for you?",
            timestamp: "2025-03-19T10:15:32Z",
            source: "llm"
        },
        {
            value: "Can you give me some workout advice?",
            timestamp: "2025-03-19T10:16:10Z",
            source: "user"
        },
        {
            value: "Sure! Are you looking for strength training, cardio, or general fitness tips?",
            timestamp: "2025-03-19T10:16:12Z",
            source: "llm"
        },
        {
            value: "I'm mainly focused on strength training.",
            timestamp: "2025-03-19T10:16:30Z",
            source: "user"
        },
        {
            value: "Great! Progressive overload is key. Try increasing weight or reps gradually over time.",
            timestamp: "2025-03-19T10:16:35Z",
            source: "llm"
        },
        {
            value: "Hey, how are you?",
            timestamp: "2025-03-19T10:15:30Z",
            source: "user"
        },
        {
            value: "I'm just a chatbot, but I'm here to help! What can I do for you?",
            timestamp: "2025-03-19T10:15:32Z",
            source: "llm"
        },
        {
            value: "Can you give me some workout advice?",
            timestamp: "2025-03-19T10:16:10Z",
            source: "user"
        },
        {
            value: "Sure! Are you looking for strength training, cardio, or general fitness tips?",
            timestamp: "2025-03-19T10:16:12Z",
            source: "llm"
        },
        {
            value: "I'm mainly focused on strength training.",
            timestamp: "2025-03-19T10:16:30Z",
            source: "user"
        },
        {
            value: "Great! Progressive overload is key. Try increasing weight or reps gradually over time.",
            timestamp: "2025-03-19T10:16:35Z",
            source: "llm"
        },
        {
            value: "Hey, how are you?",
            timestamp: "2025-03-19T10:15:30Z",
            source: "user"
        },
        {
            value: "I'm just a chatbot, but I'm here to help! What can I do for you?",
            timestamp: "2025-03-19T10:15:32Z",
            source: "llm"
        },
        {
            value: "Can you give me some workout advice?",
            timestamp: "2025-03-19T10:16:10Z",
            source: "user"
        },
        {
            value: "Sure! Are you looking for strength training, cardio, or general fitness tips?",
            timestamp: "2025-03-19T10:16:12Z",
            source: "llm"
        },
        {
            value: "I'm mainly focused on strength training.",
            timestamp: "2025-03-19T10:16:30Z",
            source: "user"
        },
        {
            value: "Great! Progressive overload is key. Try increasing weight or reps gradually over time.",
            timestamp: "2025-03-19T10:16:35Z",
            source: "llm"
        }
    ];    
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
