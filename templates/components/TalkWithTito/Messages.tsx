interface message {
    text: string;
    timeSent: Date;
    fromUser: boolean;
}

interface PropsInterface {
    messages?: message[];
}

interface MessageProps { message: message }
function Message({ message }: MessageProps) {
    return (
        <div 
        className="w-full flex"
        style={{
            justifyContent: message.fromUser ? "end" : "start"
        }}>
            
            <div className="m-2 flex flex-col">

                {/*Message text div*/}
                <div
                className="p-2 rounded-lg inter-font text-lg"
                style={{
                    backgroundColor: message.fromUser ? "#FCFFB4" : "#FFC9CE"
                }}>
                    {message.text}
                </div>

                {/*Message time div*/}
                <div className="text-sm w-full flex"
                style={{
                    justifyContent: message.fromUser ? "end" : "start"
                }}>
                    {message.timeSent.getHours() % 12 + ":" + message.timeSent.getMinutes() + ` ${message.timeSent.getHours() > 12 ? "PM" : "AM"}`}
                </div>

            </div>
        </div>
    );
}

export default function Messages({ messages }: PropsInterface) {
    const testMessages = [
        {
            text: "Hey, how's it going?",
            timeSent: new Date('2025-02-20T14:30:05'),
            fromUser: true,
        },
        {
            text: "I'm doing well, thanks for asking!",
            timeSent: new Date('2025-02-20T14:35:00'),
            fromUser: false,
        },
        {
            text: "Got any plans for the weekend?",
            timeSent: new Date('2025-02-20T14:40:15'),
            fromUser: true,
        },
        {
            text: "Not yet, but I'm thinking about going hiking.",
            timeSent: new Date('2025-02-20T14:45:30'),
            fromUser: false,
        },
        {
            text: "Sounds fun! I love hiking.",
            timeSent: new Date('2025-02-20T14:50:00'),
            fromUser: true,
        },
        {
            text: "Hey, how's it going?",
            timeSent: new Date('2025-02-20T14:30:05'),
            fromUser: true,
        },
        {
            text: "I'm doing well, thanks for asking!",
            timeSent: new Date('2025-02-20T14:35:00'),
            fromUser: false,
        },
        {
            text: "Got any plans for the weekend?",
            timeSent: new Date('2025-02-20T14:40:15'),
            fromUser: true,
        },
        {
            text: "Not yet, but I'm thinking about going hiking.",
            timeSent: new Date('2025-02-20T14:45:30'),
            fromUser: false,
        },
        {
            text: "Sounds fun! I love hiking.",
            timeSent: new Date('2025-02-20T14:50:00'),
            fromUser: true,
        },
        {
            text: "Hey, how's it going?",
            timeSent: new Date('2025-02-20T14:30:05'),
            fromUser: true,
        },
        {
            text: "I'm doing well, thanks for asking!",
            timeSent: new Date('2025-02-20T14:35:00'),
            fromUser: false,
        },
        {
            text: "Got any plans for the weekend?",
            timeSent: new Date('2025-02-20T14:40:15'),
            fromUser: true,
        },
        {
            text: "Not yet, but I'm thinking about going hiking.",
            timeSent: new Date('2025-02-20T14:45:30'),
            fromUser: false,
        },
        {
            text: "Sounds fun! I love hiking.",
            timeSent: new Date('2025-02-20T14:50:00'),
            fromUser: true,
        },
    ];

    return (
        <div className="w-full h-[85%] absolute top-0 left-0 z-[11]">
            <div className="absolute w-full h-fit max-h-[82.5%] overflow-auto bottom-0 left-0">
                {(messages || testMessages).map((message, index) => (
                    <Message key={index} message={message} />
                ))}
            </div>
        </div>
    );
}
