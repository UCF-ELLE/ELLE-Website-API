interface ChatMessage {
    value: string;
    timestamp: string;
    source: "user" | "llm";
}

interface MessageProps { message: ChatMessage } // Makes react happy (something about props and typing idk)
function Message({ message }: MessageProps) {
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

                {/*Message time div*/}
                <div className="text-sm w-full flex"
                    style={{
                        justifyContent: fromUser ? "end" : "start"
                    }}>
                    {formattedTime}
                </div>

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
