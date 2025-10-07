/* Imports */
import { useState, useEffect, useRef, useCallback, useMemo} from "react";
import { useUser } from "@/hooks/useAuth";
import { fetchModuleTerms, getChatbot, getMessages, incrementTime, sendMessage} from "@/services/TitoService";
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";
import SpeechRecognition, {useSpeechRecognition} from "react-speech-recognition";
import TitoCloudBubble from "@/components/TalkWithTito/TitoCloudBubble";

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
    const [timeChatted, setTimeChatted] = useState<number | undefined>(undefined);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [trigger, setTrigger] = useState(0);
    // --- TTS state + helpers ---
    const [ttsSupported, setTtsSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    //effect for cloud bubble
    useEffect(() => {
      async function fetchProgress() {
      const res = await fetch("twt/session/getModuleProgress");
      const data = await res.json();
      setProgress(data.proficiencyRate);

      if (data.proficiencyRate === 25) {
        setMessage("Tito remembers his hometown… but the name is fuzzy.");
        setTrigger(Date.now());
      } else if (data.proficiencyRate === 50) {
        setMessage("Tito recalls speaking another language long ago!");
        setTrigger(Date.now());
      } else if (data.proficiencyRate === 100) {
        setMessage("Tito has fully regained his memory thanks to you!");
        setTrigger(Date.now());
      }
      }
      fetchProgress();
    }, []);

    async function handleSendMessageClick() {

        if(userMessage === "" || user === undefined || props.chatbotId === undefined || !termsLoaded) return; //Does nothing if empty textarea or invalid credentials
        
        //Resets Tito state & empties textArea
        setTitoMood("thinking");
        const messageToSend = userMessage; // Store the message before clearing
        setUserMessage("");

        //Temporarily appends userMessage (no metadata yet bcs no LLM response)
        const tempUserChatMessage: ChatMessage = {
          value: messageToSend,
          timestamp: new Date().toISOString(),
          source: "user",
          metadata: undefined
        }
        setChatMessages((prevChatMessages) => [...prevChatMessages, tempUserChatMessage]);

        //Calls API
        const sendMessageResponse = await sendMessage(
          user.jwt, 
          user.userID, 
          props.chatbotId, 
          props.moduleID, 
          messageToSend, 
          terms.map(term => term.questionFront), 
          terms.filter(term => term.used === true).map(term => term.questionFront)
        );

        //Makes sure API call is succesful (it returns null if it isn't)
        if(sendMessageResponse) {
            //Sets tito mood accordingly
            setTitoMood(sendMessageResponse.titoConfused ? "confused" : "happy");
            const userResponse: ChatMessage = {
                value: messageToSend,
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
            
            console.log('[ChatScreen] Created LLM message:', llmMessage);

            //Updates ChatMessages array, removing temporary user message
            console.log('[ChatScreen] Updating chat messages with user response and LLM message');
            setChatMessages((prevChatMessages) => [...prevChatMessages.slice(0, -1), userResponse, llmMessage]);

            //Update usedTerms
            const newTerms: Term[] = terms.map(term => ({
                termID: term.termID,
                questionFront: term.questionFront,
                questionBack: term.questionBack,
                used: term.used || sendMessageResponse.termsUsed.includes(term.questionFront)
            }))
            setTerms(newTerms);

            // Automatically speak Tito's response
            if (sendMessageResponse.llmResponse && ttsSupported) {
                // Add a small delay to let the UI update before speaking
                setTimeout(() => {
                    speak(sendMessageResponse.llmResponse);
                }, 100);
            }
        }
        else {
            console.log("Error sending message");
            // Reset Tito mood on error
            setTitoMood("neutral");
            
            // Add an error message to the chat
            const errorMessage: ChatMessage = {
                value: "Sorry, I couldn't send your message. Please try again or refresh the page if the problem persists.",
                timestamp: new Date().toISOString(),
                source: "llm",
                metadata: undefined
            }
            
            // Update chat messages, replacing the temporary user message with both user message and error
            const finalUserMessage: ChatMessage = {
                value: messageToSend,
                timestamp: tempUserChatMessage.timestamp,
                source: "user",
                metadata: { error: "Message failed to send" }
            }
            
            setChatMessages((prevChatMessages) => [...prevChatMessages.slice(0, -1), finalUserMessage, errorMessage]);
        }
    }

    // --- TTS language selection ---
    const SUPPORTED_LANGS = [
      { code: "en-US", label: "English", short: "EN" },
      { code: "es-ES", label: "Español", short: "ES" },
      { code: "fr-FR", label: "Français", short: "FR" },
      { code: "pt-BR", label: "Português", short: "PT" },
    ];

    const [ttsLang, setTtsLang] = useState<string>(() => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("ttsLang") ?? "en-US";
      }
      return "en-US";
    });

    useEffect(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("ttsLang", ttsLang);
      }
    }, [ttsLang]);

    function cycleLang() {
      const i = SUPPORTED_LANGS.findIndex(l => l.code === ttsLang);
      const next = SUPPORTED_LANGS[(i + 1) % SUPPORTED_LANGS.length];
      setTtsLang(next.code);

      //Trigger TitoCloudBubble for testing
      if (next.code === "es-ES") {
        setMessage("Tito remembers his hometown… but the name is fuzzy.");
        setTrigger(Date.now());
      } else if (next.code === "fr-FR") {
        setMessage("Tito recalls speaking another language long ago!");
        setTrigger(Date.now());
      } else if (next.code === "pt-BR") {
        setMessage("Tito has fully regained his memory thanks to you!");
        setTrigger(Date.now());
      }
    }


      // --- Speech-to-Text (STT) ---
      const [sttSupported, setSttSupported] = useState(false);
      const [listening, setListening] = useState(false);
      const [interimSTT, setInterimSTT] = useState("");
      const recognitionRef = useRef<SpeechRecognition | null>(null);

      // Type helper for TS
      type SpeechRecognitionConstructor = new () => SpeechRecognition;

      // Convert digits to words function
      function convertDigitsToWords(text: string): string {
        if (!text || typeof text !== 'string') return text;
        
        // Multi-language number mappings
        const numberMappings: { [key: string]: { [key: string]: string } } = {
          'en-US': {
            '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
            '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
            '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
            '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
            '18': 'eighteen', '19': 'nineteen', '20': 'twenty'
          },
          'es-ES': {
            '0': 'cero', '1': 'uno', '2': 'dos', '3': 'tres', '4': 'cuatro',
            '5': 'cinco', '6': 'seis', '7': 'siete', '8': 'ocho', '9': 'nueve',
            '10': 'diez', '11': 'once', '12': 'doce', '13': 'trece',
            '14': 'catorce', '15': 'quince', '16': 'dieciséis', '17': 'diecisiete',
            '18': 'dieciocho', '19': 'diecinueve', '20': 'veinte'
          },
          'fr-FR': {
            '0': 'zéro', '1': 'un', '2': 'deux', '3': 'trois', '4': 'quatre',
            '5': 'cinq', '6': 'six', '7': 'sept', '8': 'huit', '9': 'neuf',
            '10': 'dix', '11': 'onze', '12': 'douze', '13': 'treize',
            '14': 'quatorze', '15': 'quinze', '16': 'seize', '17': 'dix-sept',
            '18': 'dix-huit', '19': 'dix-neuf', '20': 'vingt'
          },
          'pt-BR': {
            '0': 'zero', '1': 'um', '2': 'dois', '3': 'três', '4': 'quatro',
            '5': 'cinco', '6': 'seis', '7': 'sete', '8': 'oito', '9': 'nove',
            '10': 'dez', '11': 'onze', '12': 'doze', '13': 'treze',
            '14': 'quatorze', '15': 'quinze', '16': 'dezesseis', '17': 'dezessete',
            '18': 'dezoito', '19': 'dezenove', '20': 'vinte'
          }
        };

        const currentLangMap = numberMappings[ttsLang] || numberMappings['en-US'];
        let result = text;
        
        try {
          // First handle multi-digit numbers (20, 19, 18, ..., 10)
          // Sort by descending number value to handle longer numbers first
          const sortedNumbers = Object.keys(currentLangMap)
            .map(num => parseInt(num))
            .filter(num => num >= 10)
            .sort((a, b) => b - a);
            
          sortedNumbers.forEach(num => {
            const regex = new RegExp(`\\b${num}\\b`, 'gi');
            result = result.replace(regex, currentLangMap[num.toString()]);
          });
          
          // Then handle single digits (9, 8, 7, ..., 0)
          const singleDigits = Object.keys(currentLangMap)
            .map(num => parseInt(num))
            .filter(num => num < 10)
            .sort((a, b) => b - a);
            
          singleDigits.forEach(num => {
            const regex = new RegExp(`\\b${num}\\b`, 'gi');
            result = result.replace(regex, currentLangMap[num.toString()]);
          });
        } catch (error) {
          console.warn('Error in number conversion:', error);
          return text; // Return original text if conversion fails
        }
        
        return result;
      }

      useEffect(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;               // not supported
        setSttSupported(true);
        const rec: SpeechRecognition = new (SR as SpeechRecognitionConstructor)();
        rec.continuous = true;         // keep listening continuously until manually stopped
        rec.interimResults = true;     // show partial words as you speak
        rec.maxAlternatives = 1;
        rec.lang = ttsLang;            // use the same language you're cycling (EN/ES/FR/PT)

        rec.onstart = () => setListening(true);
        rec.onend = () => setListening(false);
        rec.onerror = (e) => {
          console.warn("STT error:", e);
          setListening(false);
        };
        rec.onresult = (ev) => {
          let interim = "";
          let finalText = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const chunk = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) finalText += chunk;
            else interim += chunk;
          }
          // Apply digit-to-word conversion to interim results
          const processedInterim = convertDigitsToWords(interim);
          setInterimSTT(processedInterim);

          // commit final text at phrase end, then clear interim preview
          if (finalText) {
            // Apply digit-to-word conversion to final text
            const processedFinalText = convertDigitsToWords(finalText.trim());
            setUserMessage(prev => (prev?.trim() ? `${prev} ${processedFinalText}` : processedFinalText));
            setInterimSTT("");
          }
        };

        recognitionRef.current = rec;
        return () => {
          try { rec.abort(); } catch {}
          recognitionRef.current = null;
        };
      }, [ttsLang]); // re-init when language changes

    function startListening() {
      if (!sttSupported || !recognitionRef.current || listening) return;
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Some browsers throw if called twice quickly
        console.warn(e);
      }
    }

    function stopListening() {
      if (!recognitionRef.current) return;
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    //Sends new timeChatted to backend
    async function saveTime() {

      if(user === undefined || props.chatbotId === undefined || timeChatted === undefined) return; //Returns early if any data is missing

      console.log("Attempting to update timeSpent");

      const result = await incrementTime(user.jwt, user.userID, props.chatbotId, 0, timeChatted / 3600);

      if(result === 200) {
        console.log("Success updating timeSpent");
      }
      else {
        console.log("Failed updating timeSpent")
      }

    }

    useEffect(() => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      setTtsSupported(true);
      const synth = window.speechSynthesis;

      const loadVoices = () => setVoices(synth.getVoices());
      loadVoices();
      synth.addEventListener("voiceschanged", loadVoices);
      return () => synth.removeEventListener("voiceschanged", loadVoices);
    }, []);

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
    }, [props.moduleID]);

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
    }, []);

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
    // useEffect(() => {
    //   console.log("timeChatted: " + timeChatted);
    // }, [timeChatted]);

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
        
        console.log(`[ChatScreen] Initializing chatbot for module ${props.moduleID}`);
        
        const loadChatbot = async () => {
            console.log(`[ChatScreen] Calling getChatbot for module ${props.moduleID}`);
            const newChatbot = await getChatbot(user.jwt, user.userID, props.moduleID, terms);
            if(newChatbot) {
              console.log(`[ChatScreen] Successfully got chatbot session ${newChatbot.chatbotId} for module ${props.moduleID}`);
              props.setChatbotId(newChatbot.chatbotId);
              setTimeChatted(newChatbot.totalTimeChatted * 3600);
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
                  used: newChatbot.termsUsed ? newChatbot.termsUsed.includes(term.questionFront) : false
              }))
              setTerms(newTerms);
            }
            else {
                console.error(`[ChatScreen] Failed to get chatbot for module ${props.moduleID}`);
                // Don't set chatbotId if session creation failed
                props.setChatbotId(undefined);
            }
        }
        loadChatbot();
    }, [props.moduleID, user, userLoading, termsLoaded])
    
    // Used to initialize chat messages - reset when module changes
    useEffect(() => {
        // Clear chat messages immediately when module changes
        setChatMessages([]);
        
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
        
        console.log(`[ChatScreen] Loading messages for moduleID: ${props.moduleID}, chatbotId: ${props.chatbotId}`);
        
        const loadMessages = async () => {
          if(!props.chatbotId) return;
          const newMessages = await getMessages(user.jwt, user.userID, props.chatbotId, props.moduleID);
          if(newMessages) {
              console.log(`[ChatScreen] Loaded ${newMessages.length} messages for module ${props.moduleID}`);
              setChatMessages([instructionMessage, ...newMessages]);
              
              // Speak the welcome message automatically when chat loads for first time
              // Only if there are no previous messages (new conversation)
              if (newMessages.length === 0 && ttsSupported && instructionMessage.value) {
                  setTimeout(() => {
                      speak(instructionMessage.value);
                  }, 1000); // Wait 1 second to let everything load
              }
          }
          else {
              console.log(`[ChatScreen] Error getting messages for module ${props.moduleID}`);
              // Set just the instruction message if no messages could be loaded
              setChatMessages([instructionMessage]);
          }
        }
        loadMessages();
    }, [props.chatbotId, props.moduleID, user, userLoading]);

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


    function speak(text: string, opts?: { rate?: number; pitch?: number; lang?: string }) {
      if (!ttsSupported || !text?.trim()) return;
      const lang = opts?.lang ?? ttsLang;

      const u = new SpeechSynthesisUtterance(text);
      // Enhanced settings for more natural speech
      u.rate = opts?.rate ?? 0.9;     // Slightly slower for clarity
      u.pitch = opts?.pitch ?? 1.0;   // Natural pitch
      u.volume = 0.8;                 // Slightly softer volume
      u.lang = lang;

      // Use Google US English as default, with fallbacks for other languages
      const langVoices = voices.filter(v => v.lang?.toLowerCase().startsWith(lang.toLowerCase()));
      
      let selectedVoice = null;
      
      // For English, prioritize Google US English
      if (lang.startsWith('en')) {
        selectedVoice = voices.find(v => v.name === 'Google US English') ||
                       langVoices.find(v => v.name.includes('Google')) ||
                       langVoices.find(v => v.name.includes('Zira')) ||
                       langVoices[0];
      } else {
        // For other languages, prefer Google voices
        selectedVoice = langVoices.find(v => v.name.includes('Google')) || langVoices[0];
      }
      
      if (selectedVoice) u.voice = selectedVoice;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }

    // Lore intro bubble on first load
    useEffect(() => {
      setMessage("I… I think I’ve lost my memories.");
      setTrigger(Date.now());
      
      const timer = setTimeout(() => {
        setMessage("Can you talk with me in different languages to help me remember them?");
        setTrigger(Date.now());
      }, 8000);

      return () => clearTimeout(timer);
    }, []);

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
                    <TitoCloudBubble message={message} trigger={trigger} />
                </div>
                <div className="w-[85%] flex items-center justify-center ">
                    <textarea 
                        placeholder = {titoMood === "thinking" ? "Tito is thinking..." : "Type here..."}
                        className="w-[85%] h-[70%] bg-white rounded p-1 resize-none overflow-y-auto"

                        style={{pointerEvents: titoMood === "thinking" ? "none" : "auto", opacity: titoMood === "thinking" ? 0.75 : 1, fontWeight: titoMood === "thinking" ? "bold" : "normal"}}
                        disabled={titoMood === "thinking"}
                        value={`${userMessage}${interimSTT ? (userMessage?.trim() ? " " : "") + interimSTT : ""}`}
                        onChange={(e) => setUserMessage(e.target.value)}
                    />
                    {/* controls column: Mic + Language */}
                  <div className="ml-2 flex items-center justify-center w-12 h-8 rounded-full bg-white/80 hover:bg-white transition text-xs font-medium">
                    {/* Click-to-toggle microphone */}
                    <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!sttSupported) {
                        alert("Speech-to-text isn't supported in Firefox. Try Chrome or Edge.");
                        return;
                      }
                      if (!listening) {
                        startListening();
                      } else {
                        stopListening();
                      }
                    }}
                    disabled={false}
                    className={`flex items-center justify-center w-16 h-16 rounded-full shadow-sm transition
                                ${listening ? "bg-red-500 text-white animate-pulse" : "bg-white/90 hover:bg-white"}`}
                    title={sttSupported ? (listening ? "Listening… click to stop" : "Click to start listening") : "Speech-to-text not supported in Firefox"}
                    aria-pressed={listening}
                    aria-label={listening ? "Stop listening" : "Start listening"}
                  >
                    <span className="text-2xl">{listening ? "🎙️" : "🎤"}</span>
                  </button>
                  </div>
                    {/* Language cycle (appears below the TTS button) */}
                      <button
                        type="button"
                        onClick={cycleLang}
                        className="ml-2 flex items-center justify-center w-12 h-12 rounded-full bg-white/80 hover:bg-white transition text-xs font-medium"
                        title={`Change TTS language (${SUPPORTED_LANGS.find(l => l.code === ttsLang)?.label})`}
                      >
                        🌐 {SUPPORTED_LANGS.find(l => l.code === ttsLang)?.short}
                      </button>
                    <button onClick={handleSendMessageClick} className="ml-2">
                        <Image src={sendMessageIcon} className="w-full h-full rounded-full" alt="Send message" />
                    </button>
                      
                </div>
            </div>
        </div>
    )
}
