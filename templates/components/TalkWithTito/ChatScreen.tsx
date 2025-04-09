/* Imports */
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { fetchModuleTerms, getChatbot, getMessages, incrementTime, sendMessage} from "@/services/TitoService";
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
    chatbotId?: number;
    setChatbotId: React.Dispatch<React.SetStateAction<number | undefined>>
    setUserBackgroundFilepath: React.Dispatch<React.SetStateAction<string>>;
    setUserMusicFilepath: React.Dispatch<React.SetStateAction<string>>;
    setTermScore: React.Dispatch<React.SetStateAction<string>>;
    setAverageScore: React.Dispatch<React.SetStateAction<number>>;
    setTimeSpent: React.Dispatch<React.SetStateAction<string>>;
    chatFontSize: string;
}

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

export default function ChatScreen(props: propsInterface) {

    const { user, loading: userLoading } = useUser();

    const [terms, setTerms] = useState<Term[]>([]);
    const [termsLoaded, setTermsLoaded] = useState<boolean>(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userMessage, setUserMessage] = useState<string>("");
    const [titoMood, setTitoMood] = useState("neutral");
    const [prevTimeChatted, setPrevTimeChatted] = useState<number | undefined>(5);
    const [timeChatted, setTimeChatted] = useState<number | undefined>(undefined);

    async function handleSendMessageClick() {

        if(userMessage === "" || user === undefined || props.chatbotId === undefined || !termsLoaded) return; //Does nothing if empty textarea or invalid credentials
        
        //Resets Tito state & empties textArea
        setTitoMood("thinking");
        setUserMessage("");

        //Temporarily appends userMessage (no metadata yet bcs no LLM response)
        const tempUserChatMessage: ChatMessage = {
          value: userMessage,
          timestamp: new Date().toISOString(),
          source: "user",
          metadata: undefined
        }
        setChatMessages((prevChatMessages) => [...prevChatMessages, tempUserChatMessage]);

        //Calls API
        const sendMessageResponse = await sendMessage(user.jwt, user.userID, props.chatbotId, props.moduleID, userMessage, terms.map(term => term.questionFront), terms.filter(term => term.used === true).map(term => term.questionFront));

        //Makes sure API call is succesful (it returns null if it isn't)
        if(sendMessageResponse) {
            //Sets tito mood accordingly
            setTitoMood(sendMessageResponse.titoConfused ? "confused" : "happy");
            //Apppends user response to chatMessages
            const userResponse: ChatMessage = {
                value: userMessage,
                timestamp: tempUserChatMessage.timestamp,
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

            //Updates ChatMessages array, removing temprorary user message
            setChatMessages((prevChatMessages) => [...prevChatMessages.slice(0, -1), userResponse, llmMessage]);

            //Update usedTerms
            const newTerms: Term[] = terms.map(term => ({
                termID: term.termID,
                questionFront: term.questionFront,
                questionBack: term.questionBack,
                used: term.used || sendMessageResponse.termsUsed.includes(term.questionFront)
            }))
            setTerms(newTerms);
        }
        else {
            console.log("Error sending message");
        }
    }

    //Sends new timeChatted to backend
    async function saveTime() {

      if(user === undefined || props.chatbotId === undefined || prevTimeChatted === undefined || timeChatted === undefined) return; //Returns early if any data is missing

      console.log(`Calling: incrementTime(${user.jwt}, ${user.userID}, ${props.chatbotId}, ${prevTimeChatted}, ${timeChatted / 3600 - prevTimeChatted});`);

      const result = await incrementTime(user.jwt, user.userID, props.chatbotId, prevTimeChatted, timeChatted / 3600 - prevTimeChatted);

      if(result === 200) {
        console.log("Success updating timeSpent");
      }
      else {
        console.log("Failed updating timeSpent")
      }

    }

    //Triggers saveTime when selecting new module OR every minute
    //Placed before other useEffect blocks to prevent dependencies from clashing
    useEffect(() => {
      saveTime(); //Calls on useEffect triggering
      const interval = setInterval(() => {
        saveTime(); //Calls each minute thereafter
      }, 60000);
      return () => {
        clearInterval(interval);
      };
    }, [props.moduleID])

    //Attempts to Trigger saveTime when user leaves page
    //May be unreliable due to page unloads not always supporting async operations
    useEffect(() => {
      const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
        saveTime();
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    }, [])

    // Used to initialize terms
    useEffect(() => {
        setTermsLoaded(false);
        
        if(props.moduleID === -1) {
          setTermsLoaded(true);
          setTerms([]);
          return;
        }
        if(userLoading || !user) return;
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
              props.setChatbotId(newChatbot.chatbotId);
              setPrevTimeChatted(newChatbot.totalTimeChatted);
              if(newChatbot.userBackground) {
                  console.log("Received LLM Background: " + newChatbot.userBackground)
                  props.setUserBackgroundFilepath(newChatbot.userBackground);
              }
              // Add User Music from chatbot
              if(newChatbot.userMusicChoice) {
                console.log("Received Music Background: " + newChatbot.userMusicChoice)
                props.setUserMusicFilepath(newChatbot.userMusicChoice);
              }
              const newTerms: Term[] = terms.map(term => ({
                  termID: term.termID,
                  questionFront: term.questionFront,
                  questionBack: term.questionBack,
                  used: newChatbot.termsUsed.includes(term.questionFront)
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
        const instructionMessage: ChatMessage = props.moduleID !== -1 ? {
            value: `Hi ${user?.username}, my name is Tito. I'm an instructional chat bot. View the vocab list on the right for a list of terms which we can chat about. Try to use them each in a sentence atleast once, then they will be crossed off to indicate you've used them correctly.`,
            timestamp: "",
            source: "llm",
            metadata: undefined
        }
        :
        {
          value: `Hi ${user?.username}, my name is Tito. I'm an instructional chat bot. Welcome to free chat, here you can ask questions or talk about whatever you like.`,
            timestamp: "",
            source: "llm",
            metadata: undefined
        }

        if(userLoading || !user || !props.chatbotId) return;
        const loadMessages = async () => {
          if(!props.chatbotId) return;
          const newMessages = await getMessages(user.jwt, user.userID, props.chatbotId);
          if(newMessages) {
              setChatMessages([instructionMessage, ...newMessages]);
          }
          else {
              console.log("Error getting messages");
          }
        }
        loadMessages();
    }, [props.chatbotId, user, userLoading]);

    //Used to update termScore
    useEffect(() => {
        if(!termsLoaded) return;
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
    }, [chatMessages])

    // Placeholder animation
    const [placeholder, setPlaceholder] = useState<string>("Tito is typing...");
    let fullPlaceholder = "Tito is typing..."

    useEffect (()=>{
      const startThinking = () =>{
        const repeatInterval = setInterval(()=>{
          setPlaceholder("");
          let i = 0;
          const interval = setInterval(()=>{
            setPlaceholder(()=>fullPlaceholder.substring(0,i));
            i++
            if (i >= fullPlaceholder.length) {
              clearInterval(interval);
            }
          }, 150)
          return () => clearInterval(interval);
        }, fullPlaceholder.length * 100 + 2000)
        const handleVisibilityChange = () => {
          if (document.hidden) {
            clearInterval(repeatInterval); // Stop the interval when the tab is not visible
          } else {
            clearInterval(repeatInterval); // Clear and restart the interval when tab is visible again
            // You can also resume from the current state instead of resetting here if needed
            startThinking()
          }
          // Add event listener for page visibility
          document.addEventListener("visibilitychange", handleVisibilityChange);
        };
        return () => {
          clearInterval(repeatInterval);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
      }
      if(titoMood === "thinking"){
        startThinking()
      }
    }, [titoMood]);

    //Test button
    function handleTestClick() {

    }

    //Initializes timeChatted
    useEffect(() => {
      if(prevTimeChatted === undefined) return;
      setTimeChatted(Math.round((prevTimeChatted*3600))); //Translates incoming time from backend to seconds from hrs
    }, [prevTimeChatted]);

    //Increments timeChatted each second
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeChatted((prev) => (prev !== undefined ? prev+1 : prev));
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    //Sets timeSpent for outer analytics page (converts from seconds to hr,min,sec)
    useEffect(() => {
      if(timeChatted === undefined) return;
      props.setTimeSpent(
        `${Math.floor(timeChatted / 3600)}h ` +
        `${Math.floor((timeChatted % 3600) / 60)}m ` +
        `${Math.floor(timeChatted % 60)}s`
      );
    }, [timeChatted]);
    
    //Test prints timeChatted
    useEffect(() => {
      console.log("timeChatted: " + timeChatted);
    }, [timeChatted]);

    //Test prints prevTimeChatted
    useEffect(() => {
      console.log("prevTimeChatted: " + prevTimeChatted);
    }, [prevTimeChatted]);


    return(
        <div className="w-full h-full"> {/*Outer container div*/}

            <Image src={background} className="w-full absolute top-0 left-0" alt="Background"/>
            <Image src={palmTree} className="absolute right-0 bottom-0 z-10 w-[33.9%] h-auto select-none" draggable={false} alt="Decorative palm tree" />
            {/*<button className="absolute right-0 top-0 z-[1000] w-[5%] h-[5%] bg-red-500 opacity-50 hover:opacity-100" onClick={handleTestClick}/>*/}

            {/*Vocabulary list div*/}
            {props.moduleID !== -1 && <VocabList wordsFront={terms?.map(term => (term.questionFront))} wordsBack={terms?.map(term => (term.questionBack))} used={terms?.map(term => (term.used))}/>}

            {/*Sent/recieved messages div*/}
            <Messages messages={chatMessages} chatFontSize={props.chatFontSize}/>

            {/* Chat box div */}
            <div className="w-full h-[15%] absolute bottom-0 left-0 bg-[#8C7357] flex z-20">
                <div className="w-[15%] h-full aspect-square flex items-center justify-center">
                    <Image 
                    src={titoMood === "confused" ? confusedTito : titoMood === "happy" ? happyTito : titoMood === "thinking" ? thinkingTito : titoMood === "neutral" ? neutralTito : neutralTito} 
                    style={{width: titoMood === "confused" || titoMood === "happy" ? "85%" : "90%"}} 
                    alt={`Tito is ${titoMood}`}
                    className={titoMood === "thinking" ? 'tito-thinking' : ''}/>
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
