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
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png"; //LLM responded titoConfused=false
import neutralTito from "@/public/static/images/ConversAItionELLE/cropped_tito.png" //Startup
import confusedTito from "@/public/static/images/ConversAItionELLE/confusedTito.png"; //LLM responded titoConfused=true
import thinkingTito from "@/public/static/images/ConversAItionELLE/respondingTito.png"; //LLM thinking

/* Components */
import VocabList from "./VocabList";
import Messages from "./Messages"

interface propsInterface {
    moduleID: number;
    setUserBackgroundFilepath: React.Dispatch<React.SetStateAction<string>>;
    setTermScore: React.Dispatch<React.SetStateAction<string>>;
    setAverageScore: React.Dispatch<React.SetStateAction<number>>;
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
        metadata?: {
          score?: number;
          error?: string;
          correction?: string;
          explanation?: string;
        }
    }

    const [terms, setTerms] = useState<Term[]>([]);
    const [termsLoaded, setTermsLoaded] = useState<boolean>(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userMessage, setUserMessage] = useState<string>("");
    const [chatbotId, setChatbotId] = useState<number>();
    const [titoMood, setTitoMood] = useState("neutral");

    async function handleSendMessageClick() {

        //Return conditions
        if(userMessage === "") return; //Does nothing if textArea empty
        console.log("Sending " + userMessage); //Testing
        if(!user || !chatbotId || !termsLoaded) {console.log("Missing user or chatbotId or termsLoaded"); return;} //Does nothing if invalid credentials
        
        //Resets Tito state & empties textArea
        setTitoMood("thinking");
        setUserMessage("");

        //Calls API
        const sendMessageResponse = await sendMessage(user.jwt, user.userID, chatbotId, props.moduleID, userMessage, terms.map(term => term.questionBack), terms.filter(term => term.used === true).map(term => term.questionBack));

        //Makes sure API call is succesful (it returns null if it isn't)
        if(sendMessageResponse) {
            //Sets tito mood accordingly
            setTitoMood(sendMessageResponse.titoConfused ? "confused" : "happy");
            //Apppends user response to chatMessages
            const userResponse: ChatMessage = {
                value: userMessage,
                timestamp: new Date().toISOString(),
                source: "user",
                metadata: sendMessageResponse.metadata
            }
            //Appends llm response to chatMessages
            const llmMessage: ChatMessage = {
                value: sendMessageResponse.llmResponse,
                timestamp: new Date().toISOString(),
                source: "llm",
                metadata: undefined //LLM Messages don't have metadata
            }
            setChatMessages((prevChatMessages) => [...prevChatMessages, userResponse, llmMessage]);
            //Update usedTerms
            const newTerms: Term[] = terms.map(term => ({
                termID: term.termID,
                questionFront: term.questionBack,
                questionBack: term.questionFront,
                used: term.used || sendMessageResponse.termsUsed.includes(term.questionBack)
            }))
            setTerms(newTerms);
        }
        else {
            console.log("Error sending message");
        }
    }

    // Used to initialize terms
    useEffect(() => {
        if(userLoading || !user) return; // Makes typescript happy :D
        const loadTerms = async () => {
            const newTerms = await fetchModuleTerms(user.jwt, props.moduleID);
            if(newTerms) {
                setTermsLoaded(true);
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
        if(userLoading || !user || !termsLoaded) return; // Returns if not ready to execute
        const loadChatbot = async () => {
            const newChatbot = await getChatbot(user.jwt, user.userID, props.moduleID, terms);
            if(newChatbot) {
                setChatbotId(newChatbot.chatbotId);
                if(newChatbot.userBackground) {
                    props.setUserBackgroundFilepath(newChatbot.userBackground);
                }
                const newTerms: Term[] = terms.map(term => ({
                    termID: term.termID,
                    questionFront: term.questionBack,
                    questionBack: term.questionFront,
                    used: newChatbot.termsUsed.includes(term.questionBack)
                }))
                setTerms(newTerms);
            }
            else {
                console.log("Error getting chatbot");
            }
        }
        loadChatbot();
    }, [props.moduleID, user, userLoading, termsLoaded])
    
    // Used to initialize chat messages
    useEffect(() => {

        //Instruction message
        const instructionMessage: ChatMessage = {
            value: `Hi ${user?.username}, my name is Tito. I'm an instructional chat bot. View the vocab list on the right for a list of terms which we can chat about. Try to use them each in a sentence atleast once, then they will be crossed off to indicate you've used them correctly.`,
            timestamp: "",
            source: "llm",
            metadata: undefined
        }

        if(userLoading || !user || !chatbotId) return; // Makes typescript happy :D
        const loadMessages = async () => {
            const newMessages = await getMessages(user.jwt, user.userID, chatbotId);
            if(newMessages) {
                setChatMessages([instructionMessage, ...newMessages]);
            }
            else {
                console.log("Error getting messages");
            }
        }
        loadMessages();
    }, [chatbotId, user, userLoading]);

    //Used to update termScore
    useEffect(() => {
        const numTerms = terms.length;
        const numUsedTerms = terms.filter(term => term.used).length;
        props.setTermScore(numUsedTerms + " / " + numTerms);
    }, [terms])

    //Used to update averageScore
    useEffect(() => {
        const messagesWithScore = chatMessages.filter(message => message.metadata?.score !== undefined);
        const averageScore = 
            messagesWithScore.length > 0 ? 
            messagesWithScore.reduce((sum, msg) => sum + (msg.metadata?.score || 0), 0) / messagesWithScore.length 
            : 0;
        props.setAverageScore(averageScore);
        console.log(averageScore);
    }, [chatMessages])
    
    
    
    const testMessages: ChatMessage[] = [
        {
          value: "What is the capital of France?",
          timestamp: "2025-03-24T10:00:00Z",
          source: "user",
          metadata: {
            score: 5,
            correction: "What is the capital of Spain?",
            explanation: "The user might have intended to ask about Spain."
          }
        },
        {
          value: "The capital of France is Paris.",
          timestamp: "2025-03-24T10:00:10Z",
          source: "llm"
        },
        {
          value: "What are the best exercises for strength training?",
          timestamp: "2025-03-24T10:01:00Z",
          source: "user",
          metadata: {
            score: 8,
            error: "Minor grammar mistake",
            correction: "What are the best exercises for building strength?",
            explanation: "Adjusted phrasing for clarity."
          }
        },
        {
          value: "Some great strength training exercises include squats, deadlifts, and bench presses.",
          timestamp: "2025-03-24T10:01:10Z",
          source: "llm"
        },
        {
            value: "What is the capital of France?",
            timestamp: "2025-03-24T10:00:00Z",
            source: "user",
            metadata: {
              score: 5,
              correction: "What is the capital of Spain?",
              explanation: "The user might have intended to ask about Spain."
            }
          },
          {
            value: "The capital of France is Paris.",
            timestamp: "2025-03-24T10:00:10Z",
            source: "llm"
          },
          {
            value: "What are the best exercises for strength training?",
            timestamp: "2025-03-24T10:01:00Z",
            source: "user",
            metadata: {
              score: 8,
              error: "Minor grammar mistake",
              correction: "What are the best exercises for building strength?",
              explanation: "Adjusted phrasing for clarity."
            }
          },
          {
            value: "Some great strength training exercises include squats, deadlifts, and bench presses.",
            timestamp: "2025-03-24T10:01:10Z",
            source: "llm"
          },
          {
            value: "What is the capital of France?",
            timestamp: "2025-03-24T10:00:00Z",
            source: "user",
            metadata: {
              score: 5,
              correction: "What is the capital of Spain?",
              explanation: "The user might have intended to ask about Spain."
            }
          },
          {
            value: "The capital of France is Paris.",
            timestamp: "2025-03-24T10:00:10Z",
            source: "llm"
          },
          {
            value: "What are the best exercises for strength training?",
            timestamp: "2025-03-24T10:01:00Z",
            source: "user",
            metadata: {
              score: 8,
              error: "Minor grammar mistake",
              correction: "What are the best exercises for building strength?",
              explanation: "Adjusted phrasing for clarity."
            }
          },
          {
            value: "Some great strength training exercises include squats, deadlifts, and bench presses.",
            timestamp: "2025-03-24T10:01:10Z",
            source: "llm"
          },
          {
            value: "What is the capital of France?",
            timestamp: "2025-03-24T10:00:00Z",
            source: "user",
            metadata: {
              score: 5,
              correction: "What is the capital of Spain?",
              explanation: "The user might have intended to ask about Spain."
            }
          },
          {
            value: "The capital of France is Paris.",
            timestamp: "2025-03-24T10:00:10Z",
            source: "llm"
          },
          {
            value: "What are the best exercises for strength training?",
            timestamp: "2025-03-24T10:01:00Z",
            source: "user",
            metadata: {
              score: 8,
              error: "Minor grammar mistake",
              correction: "What are the best exercises for building strength?",
              explanation: "Adjusted phrasing for clarity."
            }
          },
          {
            value: "Some great strength training exercises include squats, deadlifts, and bench presses.",
            timestamp: "2025-03-24T10:01:10Z",
            source: "llm"
          },
          {
            value: "What is the capital of France?",
            timestamp: "2025-03-24T10:00:00Z",
            source: "user",
            metadata: {
              score: 5,
              correction: "What is the capital of Spain?",
              explanation: "The user might have intended to ask about Spain."
            }
          },
          {
            value: "The capital of France is Paris.",
            timestamp: "2025-03-24T10:00:10Z",
            source: "llm"
          },
          {
            value: "What are the best exercises for strength training?",
            timestamp: "2025-03-24T10:01:00Z",
            source: "user",
            metadata: {
              score: 8,
              error: "Minor grammar mistake",
              correction: "What are the best exercises for building strength?",
              explanation: "Adjusted phrasing for clarity."
            }
          },
          {
            value: "Some great strength training exercises include squats, deadlifts, and bench presses.",
            timestamp: "2025-03-24T10:01:10Z",
            source: "llm"
          },
      ];

    return(
        <div className="w-full h-full"> {/*Outer container div*/}

            <Image src={background} className="w-full absolute top-0 left-0" alt="Background"/>
            <Image src={palmTree} className="absolute right-0 bottom-0 z-10 w-[33.9%] h-auto select-none" draggable={false} alt="Decorative palm tree" />

            {/*Vocabulary list div*/}
            <VocabList wordsFront={terms?.map(term => (term.questionFront))} wordsBack={terms?.map(term => (term.questionBack))} used={terms?.map(term => (term.used))}/>

            {/*Sent/recieved messages div*/}
            <Messages messages={chatMessages[0] ? chatMessages : testMessages}/>

            {/* Chat box div */}
            <div className="w-full h-[15%] absolute bottom-0 left-0 bg-[#8C7357] flex z-20">
                <div className="w-[15%] h-full aspect-square flex items-center justify-center">
                    <Image 
                    src={titoMood === "confused" ? confusedTito : titoMood === "happy" ? happyTito : titoMood === "thinking" ? thinkingTito : titoMood === "neutral" ? neutralTito : neutralTito} 
                    style={{width: titoMood === "confused" || titoMood === "happy" ? "85%" : "90%"}} 
                    alt={`Tito is ${titoMood}`}/>
                </div>
                <div className="w-[85%] flex items-center justify-center ">
                    <textarea 
                        placeholder = {titoMood === "thinking" ? "Tito is thinking..." : "Type here..."}
                        className="w-[85%] h-[70%] bg-white rounded p-1 resize-none overflow-y-auto"
                        style={{pointerEvents: titoMood === "thinking" ? "none" : "auto", opacity: titoMood === "thinking" ? 0.75 : 1, fontWeight: titoMood === "thinking" ? "bold" : "normal"}}
                        disabled={titoMood === "thinking"}
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                    />
                    <button onClick={handleSendMessageClick} className="ml-2">
                        <Image src={sendMessageIcon} className="w-full h-full rounded-full" alt="Send message" />
                    </button>
                </div>
            </div>
        </div>
    )
}