/* Imports */
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { fetchModuleTerms, getChatbot, getMessages, sendMessage} from "@/services/TitoService";
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";

/* Assets */
import background from "@/public/static/images/ConversAItionELLE/Graident Background.png";
import palmTree from "@/public/static/images/ConversAItionELLE/Palm Tree.png";
import sendMessageIcon from "@/public/static/images/ConversAItionELLE/send.png";

/* Titos :D */
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png";
import neutralTito from "@/public/static/images/ConversAItionELLE/tito.png"
import confusedTito from "@/public/static/images/ConversAItionELLE/confusedTito.png";
import tiredTito from "@/public/static/images/ConversAItionELLE/tiredTito.png";
import respondingTito from "@/public/static/images/ConversAItionELLE/respondingTito.png";

/* Components */
import VocabList from "./VocabList";
import Messages from "./Messages"


interface propsInterface {
    moduleID: number;
}

export default function ChatScreen(props: propsInterface) {

    const { user, loading: userLoading } = useUser();

    interface Term {
        termID: number;
        questionFront: string;
        questionBack: string;
        used: boolean;
    }

    interface ChatMessage {
        value: string;
        timestamp: string;
        source: "user" | "llm";
    }

    const [terms, setTerms] = useState<Term[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userMessage, setUserMessage] = useState<string>("");
    const [chatbotId, setChatbotId] = useState<number>();

    async function handleSendMessageClick() {
        if(userMessage === "") return;
        console.log("Sending " + userMessage);
        if(!user || !chatbotId) {console.log("Missing user or chatbotId"); return;}
        const sendMessageResponse = await sendMessage(user.jwt, user.userID, chatbotId, props.moduleID, userMessage);
        if(sendMessageResponse) {
            //Appends llm response to chatMessages
            const newMessage: ChatMessage = {
                value: sendMessageResponse.llmValue,
                timestamp: new Date().toISOString(),
                source: "llm"
            }
            setChatMessages((prevChatMessages) => [...prevChatMessages, newMessage]);
            //TODO: Update usedTerms
        }
        setUserMessage("");
    }

    // Used to initialize terms
    useEffect(() => {
        if(userLoading || !user) return; // Makes typescript happy :D
        const loadTerms = async () => {
            const newTerms = await fetchModuleTerms(user.jwt, props.moduleID);
            if(newTerms) {
                setTerms(newTerms.map(term => ({
                    termID: term.termID,
                    questionFront: term.questionFront,
                    questionBack: term.questionBack,
                    used: false
                })));
            }
            else {
                console.log("Error getting terms");
            }
        }
        loadTerms();
    }, [props.moduleID, user, userLoading]);

    //Used to initialize chatbot
    useEffect(() => {
        if(userLoading || !user) return; // Makes typescript happy :D
        const loadChatbot = async () => {
            const newChatbot = await getChatbot(user.jwt, user.userID, props.moduleID, terms);
            if(newChatbot) {
                setChatbotId(newChatbot.chatbotId);
                //TODO: Set usedTerms
            }
            else {
                console.log("Error getting chatbot");
            }
        }
        loadChatbot();
    }, [props.moduleID, terms, user, user?.jwt, user?.userID, userLoading])
    

    // Used to initialize chat messages
    useEffect(() => {
        if(userLoading || !user || !chatbotId) return; // Makes typescript happy :D
        const loadMessages = async () => {
            const newMessages = await getMessages(user.jwt, user.userID, chatbotId);
            if(newMessages) {
                setChatMessages(newMessages);
            }
            else {
                console.log("Error getting messages");
            }
        }
        loadMessages();
    }, [chatbotId, user, userLoading]);
    

    return(
        <div className="w-full h-full"> {/*Outer container div*/}

            <Image src={background} className="w-full absolute top-0 left-0" alt="Background"/>
            <Image src={palmTree} className="absolute right-0 bottom-0 z-10 w-[33.9%] h-auto select-none" draggable={false} alt="Decorative palm tree" />

            {/*Vocabulary list div*/}
            {/* TODO: Modify+reformat to take in 'terms' */}
            <VocabList wordsFront={terms?.map(term => (term.questionFront))} wordsBack={terms?.map(term => (term.questionBack))} used={terms?.map(term => (term.used))}/>

            {/*Sent/recieved messages div*/}
            <Messages messages={chatMessages}/>

            {/* Chat box div */}
            <div className="w-full h-[15%] absolute bottom-0 left-0 bg-[#8C7357] flex items-center justify-center p-4">
                <textarea 
                    placeholder="Type here..." 
                    className="w-[80%] min-h-[3em] h-fit max-h-[7em] bg-white rounded-lg p-2 resize-none overflow-y-auto focus:ring-2"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                />
                <button onClick={handleSendMessageClick} className="ml-2 z-20">
                    <Image src={sendMessageIcon} className="w-full h-full rounded-full" alt="Send message" />
                </button>
            </div>
        </div>
    )
}