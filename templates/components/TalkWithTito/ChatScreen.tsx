/* Imports */
import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo 
} from "react";
import Image from "next/image";

import { useUser } from "@/hooks/useAuth";
import { 
  fetchModuleTerms, 
  getChatbot, 
  getMessages, 
  incrementTime, 
  sendMessage, 
  uploadAudioFile, 
  fetchSessions, 
  deleteSession, 
  resetTermProgress,
  ELLE_URL 
} from "@/services/TitoService";

import "@/public/static/css/talkwithtito.css";

/* Chat interface assets */
import background from "@/public/static/images/ConversAItionELLE/Graident Background.png";
import palmTree from "@/public/static/images/ConversAItionELLE/Palm Tree.png";
import sendMessageIcon from "@/public/static/images/ConversAItionELLE/send.png";
import micIcon from "@/public/static/images/ConversAItionELLE/mic.png";
import volumeIcon from "@/public/static/images/ConversAItionELLE/volume.png";
import muteIcon from "@/public/static/images/ConversAItionELLE/mute.png";

/* Tito character states */
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png"; // LLM response received
import neutralTito from "@/public/static/images/ConversAItionELLE/cropped_tito.png"; // Initial/default state
import confusedTito from "@/public/static/images/ConversAItionELLE/confusedTito.png"; // LLM response indicates confusion
import thinkingTito from "@/public/static/images/ConversAItionELLE/respondingTito.png"; // Waiting for LLM response

/* Child components */
import VocabList from "./VocabList";
import Messages from "./Messages";
import Fireworks from "./Fireworks";


interface SpeechRecognition extends EventTarget {
  start(): void;
  stop(): void;
  abort(): void;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface ChatScreenProps {
  moduleID: number;
  moduleName?: string; // Module topic, such as "La Comida"
  moduleLanguage?: string; // Language code, such as "es", "fr", or "pt"
  chatbotId?: number;
  setChatbotId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setUserBackgroundFilepath: React.Dispatch<React.SetStateAction<string>>;
  setUserMusicFilepath: React.Dispatch<React.SetStateAction<string>>;
  setTermScore: React.Dispatch<React.SetStateAction<string>>;
  setAverageScore: React.Dispatch<React.SetStateAction<number>>;
  setTimeSpent: React.Dispatch<React.SetStateAction<string>>;
  chatFontSize: string;
  ttsMuted: boolean;
  setTtsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  sessions?: any[];
  titoWelcomeMessage?: string;
}

interface Term {
  termID: number;
  questionFront: string;
  questionBack: string;
  usageCount: number;
  used?: boolean;
}

type ModuleProgressMap = Record<number, number>;

interface ChatMessage {
  value: string;
  timestamp: string;
  source: "user" | "llm";
  metadata?: {
    score?: number;
    error?: string;
    correction?: string;
    explanation?: string;
  };
}


/**
 * Generates acceptable vocabulary variations for matching student messages.
 *
 * Supports slash-separated alternatives, basic gender and plural variations,
 * and optional article removal for Spanish, French, Portuguese, and English.
 */
function getWordVariations(word: string, lang: string): string[] {
  let parts: string[][] = word.split(/\s+/).map(part => {
    if (!part.includes('/')) {
      return [part];
    }

    const segments = part.split('/');
    const base = segments[0];
    const suffixes = segments.slice(1);
    const options = [base];

    const vowels = /[aeiouáéíóúüñàèìòùâêîôûçäëïöüß]/i;
    const isVowel = (char: string) => vowels.test(char);

    suffixes.forEach((suffix) => {
      const isStandaloneAlternative =
        suffix.length >= base.length - 1 ||
        base.length <= 2 ||
        ["la", "una", "un", "les", "des"].includes(
          suffix.toLowerCase()
        );

      if (isStandaloneAlternative) {
        options.push(suffix);
        return;
      }

      const baseEndsWithVowel = isVowel(base[base.length - 1]);
      const suffixStartsWithVowel = isVowel(suffix[0]);

      if (baseEndsWithVowel && suffixStartsWithVowel) {
        options.push(base.slice(0, -1) + suffix);
      } else {
        options.push(base + suffix);
      }
    });

    return options;
  });

  let phrases: string[][] = [[]];

  parts.forEach((options) => {
    const nextPhrases: string[][] = [];

    phrases.forEach((phrase) => {
      options.forEach((option) => {
        nextPhrases.push([...phrase, option]);
      });
    });

    phrases = nextPhrases;
  });

  const finalVariations = new Set<string>();
  const language = lang.toLowerCase();

  phrases.forEach((phraseWords) => {
    const phrase = phraseWords.join(" ");
    finalVariations.add(phrase);

    const inflectedWords = phraseWords.map((wordOption) => {
      const wordVariations = new Set<string>([wordOption]);
      const wordLength = wordOption.length;

      if (wordLength <= 2) {
        return Array.from(wordVariations);
      }

      const lastCharacter =
        wordOption[wordLength - 1].toLowerCase();

      if (language === "es" || language === "pt") {
        if (lastCharacter === "o") {
          wordVariations.add(wordOption.slice(0, -1) + "a");
          wordVariations.add(wordOption.slice(0, -1) + "os");
          wordVariations.add(wordOption.slice(0, -1) + "as");
        } else if (lastCharacter === "a") {
          wordVariations.add(wordOption.slice(0, -1) + "o");
          wordVariations.add(wordOption.slice(0, -1) + "as");
          wordVariations.add(wordOption.slice(0, -1) + "os");
        } else if (lastCharacter === "e") {
          wordVariations.add(wordOption + "s");
        } else {
          wordVariations.add(wordOption + "a");
          wordVariations.add(wordOption + "es");
          wordVariations.add(wordOption + "as");
        }
      } else if (language === "fr") {
        if (lastCharacter === "e") {
          wordVariations.add(wordOption + "s");
        } else {
          wordVariations.add(wordOption + "e");
          wordVariations.add(wordOption + "s");
          wordVariations.add(wordOption + "es");
        }
      } else if (
        wordOption.endsWith("y") &&
        !/[aeiou]/i.test(wordOption[wordLength - 2] || "")
      ) {
        wordVariations.add(wordOption.slice(0, -1) + "ies");
      } else {
        wordVariations.add(wordOption + "s");
        wordVariations.add(wordOption + "es");
      }

      return Array.from(wordVariations);
    });

    let phraseVariations: string[][] = [[]];

    inflectedWords.forEach((wordVariations) => {
      const nextPhraseVariations: string[][] = [];

      phraseVariations.forEach((phraseVariation) => {
        wordVariations.forEach((wordVariation) => {
          nextPhraseVariations.push([
            ...phraseVariation,
            wordVariation,
          ]);
        });
      });

      phraseVariations = nextPhraseVariations;
    });

    phraseVariations.forEach((phraseVariation) => {
      finalVariations.add(phraseVariation.join(" "));
    });
  });

  const articleRegex =
    /^(el|la|los|las|un|una|unos|unas|le|les|l'|une|des)\s+/i;

  finalVariations.forEach((variation) => {
    if (articleRegex.test(variation)) {
      finalVariations.add(
        variation.replace(articleRegex, "")
      );
    }
  });

  return Array.from(finalVariations);
}

export default function ChatScreen(props: ChatScreenProps) {
  const { user, loading: userLoading } = useUser();

  /* Chat and module state */
  const [terms, setTerms] = useState<Term[]>([]);
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [titoMood, setTitoMood] = useState("neutral");
  const [timeChatted, setTimeChatted] = useState<number>();

  /*
   * Calculates vocabulary progress dynamically from the current terms state.
   */
  const progress = useMemo(() => {
    const total = terms.length;
    if (total === 0) return 0;
    const completed = terms.filter((term) => (term.usageCount ?? 0) >= 3).length;
    return Math.round((completed / total) * 100);
  }, [terms]);

  /* Dynamically sync overall term score to parent component */
  useEffect(() => {
    if (terms.length > 0) {
      const completedCount = terms.filter((term) => (term.usageCount ?? 0) >= 3).length;
      props.setTermScore(`${completedCount} / ${terms.length}`);
    } else {
      props.setTermScore("0 / 0");
    }
  }, [terms, props.setTermScore]);

  /* Completion celebration */
  const [showFireworks, setShowFireworks] = useState(false);
  const previousProgressRef = useRef(progress);

  useEffect(() => {
    let fireworksTimeout: ReturnType<typeof setTimeout> | undefined;

    const reachedCompletion =
      progress === 100 &&
      previousProgressRef.current < 100;

    if (reachedCompletion) {
      setShowFireworks(true);

      fireworksTimeout = setTimeout(() => {
        setShowFireworks(false);
      }, 4000);
    }

    previousProgressRef.current = progress;

    return () => {
      if (fireworksTimeout) {
        clearTimeout(fireworksTimeout);
      }
    };
  }, [progress]);

  const handleReset = useCallback(async () => {
    // 1. Reset local React state immediately for snappy UI
    setTerms((previousTerms) =>
      previousTerms.map((term) => ({
        ...term,
        usageCount: 0,
      }))
    );

    // 2. Call backend to reset the term progress in the database
    if (user?.jwt && props.moduleID !== -1 && props.chatbotId !== undefined) {
      console.log(`[ChatScreen] Resetting term progress in database for module ${props.moduleID}, session ${props.chatbotId}`);
      await resetTermProgress(user.jwt, props.moduleID, props.chatbotId);
    }
  }, [user?.jwt, props.moduleID, props.chatbotId]);

  /* Vocabulary mastery state */
  const [masteredSet, setMasteredSet] =
    useState<Set<number>>(new Set());
  const [masteredTermIDs, setMasteredTermIDs] =
    useState<number[]>([]);
  const [classID, setClassID] = useState<string | null>(null);

  /* Text-to-speech support */
const [ttsSupported, setTtsSupported] = useState(false);
const [voices, setVoices] =
  useState<SpeechSynthesisVoice[]>([]);

/**
 * Normalizes vocabulary usage counts returned by the backend and applies
 * them to the currently loaded terms.
 */
const applyBackendUsageCounts = useCallback((data: any) => {
  const usageMap = new Map<number, number>();

  if (data?.progressByTerm && typeof data.progressByTerm === "object" && !Array.isArray(data.progressByTerm)) {
    Object.entries(data.progressByTerm).forEach(([termIDStr, termProgressObj]: [string, any]) => {
      const termID = Number(termIDStr);
      const usageCount = Number(
        termProgressObj?.timesUsed ??
          termProgressObj?.times_used ??
          termProgressObj?.usageCount ??
          0
      );
      if (Number.isFinite(termID)) {
        usageMap.set(termID, Math.max(0, Math.min(3, usageCount)));
      }
    });
  } else {
    const usageArray =
      data?.usageByTerm ??
      data?.termUsageCounts ??
      data?.termProgress ??
      data?.progress ??
      [];

    if (Array.isArray(usageArray)) {
      usageArray.forEach((item: any) => {
        const termID = Number(
          item?.termID ??
            item?.termId ??
            item?.id
        );

        const usageCount = Number(
          item?.timesUsed ??
            item?.usageCount ??
            item?.count ??
            item?.times_used ??
            0
        );

        if (Number.isFinite(termID)) {
          usageMap.set(termID, Math.max(0, Math.min(3, usageCount)));
        }
      });
    }
  }

  setTerms((previousTerms) =>
    previousTerms.map((term) => ({
      ...term,
      usageCount: usageMap.get(term.termID) ?? 0,
    }))
  );

  return usageMap;
}, []);

/**
 * Loads vocabulary mastery, usage counts, and overall module progress.
 */
const fetchTermProgress = useCallback(async () => {
  if (!user?.jwt || props.moduleID === -1) {
    return;
  }

  const url =
    `${ELLE_URL}/twt/session/getTermProgress` +
    `?moduleID=${props.moduleID}` +
    (props.chatbotId !== undefined ? `&chatbotSID=${props.chatbotId}` : "");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${user.jwt}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const responseBody = await response
        .text()
        .catch(() => "<no response body>");

      console.error("[TermProgress] Request failed", {
        status: response.status,
        url,
        responseBody,
      });

      setMasteredSet(new Set());
      setMasteredTermIDs([]);
      return;
    }

    const payload = await response
      .json()
      .catch(() => ({}));

    const data = payload?.data ?? payload ?? {};

    const masteredIDs = (
      data?.masteredIDs ??
      data?.masteredTermIDs ??
      []
    )
      .map(Number)
      .filter(Number.isFinite);

    setMasteredSet(new Set(masteredIDs));
    setMasteredTermIDs(masteredIDs);

    const usageMap = applyBackendUsageCounts(data);

    const totalTerms =
      terms.length || usageMap.size;

    const masteredTerms = Array.from(
      usageMap.values()
    ).filter((usageCount) => usageCount >= 3).length;
  } catch (error) {
    console.error(
      "[TermProgress] Unexpected request error",
      { url, error }
    );

    setMasteredSet(new Set());
    setMasteredTermIDs([]);
  }
}, [
  user?.jwt,
  props.moduleID,
  props.chatbotId,
  terms.length,
  applyBackendUsageCounts,
]);

/* Load vocabulary progress when the selected module changes */
useEffect(() => {
  void fetchTermProgress();
}, [fetchTermProgress]);

/*
 * Synchronize each vocabulary term's legacy `used` flag with the
 * student's existing chat history after both resources have loaded.
 */
useEffect(() => {
  if (!termsLoaded || chatMessages.length <= 1) {
    return;
  }

  setTerms((previousTerms) => {
    let termsChanged = false;

    const updatedTerms = previousTerms.map((term) => {
      const normalizedTerm =
        term.questionFront.toLowerCase();

      const isUsed = chatMessages.some(
        (message) =>
          message.source === "user" &&
          message.value
            .toLowerCase()
            .includes(normalizedTerm)
      );

      if (term.used !== isUsed) {
        termsChanged = true;
      }

      return {
        ...term,
        used: isUsed,
      };
    });

    return termsChanged
      ? updatedTerms
      : previousTerms;
  });
}, [chatMessages, termsLoaded]);


/* Initialize a new chatbot session or restore an existing session */
useEffect(() => {
  const isFreeChat = props.moduleID === -1;

  if (
    userLoading ||
    !user ||
    !termsLoaded ||
    (!isFreeChat && terms.length === 0)
  ) {
    return;
  }

  const loadChatbot = async () => {
    /*
     * An existing chatbot ID means the student selected a previous
     * conversation, so getChatbot must not create a new session.
     */
    if (props.chatbotId !== undefined) {
      console.log(
        `[ChatScreen] Existing chatbot session ${props.chatbotId} provided, skipping session creation.`
      );

      const existingSession = props.sessions?.find(
        (session) =>
          session.chatbotSID === props.chatbotId
      );

      if (existingSession) {
        console.log(
          "[ChatScreen] Found existing session details:",
          existingSession
        );

        setTimeChatted(
          (existingSession.timeChatted || 0) * 60
        );
      } else {
        setTimeChatted(0);
      }

      await fetchTermProgress();
      return;
    }

    console.log(
      `[ChatScreen] Calling getChatbot for module ${props.moduleID}`
    );

    const newChatbot = await getChatbot(
      user.jwt,
      user.userID,
      props.moduleID,
      terms
    );

    if (!newChatbot) {
      console.error(
        `[ChatScreen] Failed to get chatbot for module ${props.moduleID}`
      );

      props.setChatbotId(undefined);
      return;
    }

    console.log(
      `[ChatScreen] Successfully got chatbot session ${newChatbot.chatbotId} for module ${props.moduleID}`
    );

    props.setChatbotId(newChatbot.chatbotId);
    setTimeChatted(
      newChatbot.totalTimeChatted * 3600
    );

    if (newChatbot.userBackground) {
      console.log(
        "Received LLM Background:",
        newChatbot.userBackground
      );

      props.setUserBackgroundFilepath(
        newChatbot.userBackground
      );
    }

    if (newChatbot.userMusicChoice) {
      console.log(
        "Received Music Background:",
        newChatbot.userMusicChoice
      );

      props.setUserMusicFilepath(
        newChatbot.userMusicChoice
      );
    }

    const usageMap =
      applyBackendUsageCounts(newChatbot);

    /*
     * Older backend responses may only contain a termsUsed array.
     * Preserve that fallback when no per-term usage map is returned.
     */
    if (usageMap.size === 0) {
      const initializedTerms: Term[] = terms.map(
        (term) => {
          const backendCount =
            newChatbot.termsUsed?.filter(
              (usedTerm: string) =>
                usedTerm === term.questionFront
            ).length ?? 0;

          return {
            termID: term.termID,
            questionFront: term.questionFront,
            questionBack: term.questionBack,
            usageCount: Math.min(
              Math.max(backendCount, 0),
              3
            ),
          };
        }
      );

      setTerms(initializedTerms);
    }

    await fetchTermProgress();
  };

  void loadChatbot();
}, [
  props.moduleID,
  props.chatbotId,
  user?.jwt,
  termsLoaded,
]);


async function handleSendMessageClick(
  forcedMessage?: string | React.MouseEvent, 
  hintWord?: string
  ) {
    /* Validate and prepare the outgoing message */
    const isString = typeof forcedMessage === "string";
    const messageToUse = (
      isString ? forcedMessage : userMessage
    ) as string;

    if (
      messageToUse === "" || 
      user === undefined || 
      props.chatbotId === undefined || 
      !termsLoaded
      ) {
      console.log(
        `[ChatScreen] Send blocked - message: '${messageToUse}', user: ${!!user}, chatbotId: ${props.chatbotId}, termsLoaded: ${termsLoaded}`
      );
      return;
    }

    setTitoMood("thinking");

    const messageToSend = messageToUse;
    setUserMessage("");

    /* Display the user's message immediately while awaiting the backend */
    const tempUserChatMessage: ChatMessage = {
      value: messageToSend,
      timestamp: new Date().toISOString(),
      source: "user",
      metadata: undefined
    };

    setChatMessages((prevChatMessages) => [
      ...prevChatMessages, 
      tempUserChatMessage
    ]);

    /* Send the message and current vocabulary progress to Tito */
    const sendMessageResponse = await sendMessage(
      user.jwt,
      user.userID,
      props.chatbotId,
      props.moduleID,
      messageToSend,
      terms.map(term => term.questionFront),

      // ONLY send words that are fully completed under the 3-use rule
      terms
        .filter(term => term.usageCount >= 3)
        .map(term => term.questionFront),

      undefined,
      wasVoiceMessage,
      hintWord
    );

    console.log("[ChatScreen] Checking audio upload conditions:", {
      sendMessageResponse: !!sendMessageResponse,
      wasVoiceMessage,
      audioBlob: !!audioBlob,
      audioBlobSize: audioBlob ? audioBlob.size : 0,
      messageID: sendMessageResponse?.messageID
    });

    /* Upload the recording when the message was created through speech input */
    let messageId: number | undefined;
    if (sendMessageResponse && wasVoiceMessage && audioBlob) {
      messageId = sendMessageResponse.messageID;
      console.log("[ChatScreen] Audio upload starting for message ID:", messageId);
      if (messageId && typeof messageId === "number" && messageId > 0) {
        let uploadClassID = classID;
        if (!uploadClassID && props.moduleID !== -1) {
          console.log("[ChatScreen] classID not available, fetching...");
          const res = await fetch(`${ELLE_URL}/twt/session/access`, {
            headers: { Authorization: `Bearer ${user.jwt}`, Accept: "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            const pairs = data?.data ?? data;
            for (const [cID, modulesList] of pairs) {
              for (const [mID] of modulesList) {
                if (mID === props.moduleID) {
                  uploadClassID = String(cID);
                  break;
                }
              }
              if (uploadClassID) break;
            }
          }
        }

        const finalClassID = uploadClassID ? parseInt(uploadClassID) : 1;

        try {
          const uploadResult = await uploadAudioFile(
            user.jwt,
            messageId,
            props.chatbotId,
            finalClassID,
            props.moduleID,
            audioBlob
          );
          console.log("[ChatScreen] Audio upload result:", uploadResult);
        } catch (error) {
          console.error("[ChatScreen] Failed to upload audio:", error);
        }
      } else {
        console.warn("[ChatScreen] Audio upload skipped - no valid messageID received from server");
        console.warn("[ChatScreen] This typically happens when the message failed to save or Tito had an error responding");
      }

      setWasVoiceMessage(false);
      setAudioBlob(null);
      console.log("[ChatScreen] Audio upload process completed, states reset");
    } else {
      console.log("[ChatScreen] Audio upload skipped - conditions not met");
      if (wasVoiceMessage) {
        setWasVoiceMessage(false);
        setAudioBlob(null);
      }
    }

    /* Process a successful Tito response */
    if (sendMessageResponse) {
      setTitoMood(sendMessageResponse.titoConfused ? "confused" : "happy");
      const userResponse: ChatMessage = {
        value: messageToSend,
        timestamp: tempUserChatMessage.timestamp,
        source: "user",
        metadata: sendMessageResponse.metadata
      };

      const llmMessage: ChatMessage = {
        value: sendMessageResponse.llmResponse,
        timestamp: new Date().toISOString(),
        source: "llm",
        metadata: undefined
      };

      console.log("[ChatScreen] Created LLM message:", llmMessage);
      console.log("[ChatScreen] Updating chat messages with user response and LLM message");
      setChatMessages((prevChatMessages) => [...prevChatMessages.slice(0, -1), userResponse, llmMessage]);

      /* Update vocabulary usage counts from the backend or local matching */
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^\w\sáéíóúüñàèìòùâêîôûçäëïöüß]/g, "").trim();

      const usageArray =
        Array.isArray(sendMessageResponse?.usageByTerm) ? sendMessageResponse.usageByTerm :
          Array.isArray(sendMessageResponse?.termUsageCounts) ? sendMessageResponse.termUsageCounts :
            Array.isArray(sendMessageResponse?.termProgress) ? sendMessageResponse.termProgress :
              Array.isArray(sendMessageResponse?.progress) ? sendMessageResponse.progress :
                [];

      const responseUsageMap = new Map<number, number>();
      usageArray.forEach((item: any) => {
        const termID = Number(item?.termID ?? item?.termId ?? item?.id);
        const timesUsed = Number(
          item?.timesUsed ??
          item?.usageCount ??
          item?.count ??
          0
        );

        if (Number.isFinite(termID)) {
          responseUsageMap.set(termID, Math.max(0, Math.min(3, timesUsed)));
        }
      });

      const newTerms: Term[] = terms.map((term) => {
        const front = term.questionFront ?? "";
        const back = term.questionBack ?? "";

        if (responseUsageMap.has(term.termID)) {
          return {
            termID: term.termID,
            questionFront: front,
            questionBack: back,
            usageCount: responseUsageMap.get(term.termID) ?? 0,
          };
        }

        const cleanMsg = messageToSend.toLowerCase().replace(/[^\w\sáéíóúüñàèìòùâêîôûçäëïöüß]/g, " ");
        const lang = props.moduleLanguage || "es";
        const variations = getWordVariations(front, lang);

        const usedByMessage =
          !hintWord &&
          front.length > 0 &&
          variations.some((variant) => {
            const cleanVariant = normalize(variant);
            if (!cleanVariant) return false;
            const escapedVariant = cleanVariant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedVariant}\\b`, 'i');
            return regex.test(cleanMsg);
          });

        const usedByBackend =
          sendMessageResponse?.termsUsed?.some(
            (used: any) => {
              if (typeof used === "number") {
                return used === term.termID;
              }
              const cleanUsed = normalize(String(used));
              const termVars = getWordVariations(front, lang).map(normalize);
              return termVars.includes(cleanUsed);
            }
          ) ?? false;

        const matched = usedByMessage || usedByBackend;

        return {
          termID: term.termID,
          questionFront: front,
          questionBack: back,
          usageCount: matched ? Math.min((term.usageCount ?? 0) + 1, 3) : (term.usageCount ?? 0),
        };
      });

      setTerms(newTerms);


      /* Read Tito's response aloud when narration is enabled */
      if (
        sendMessageResponse.llmResponse && 
        ttsSupported && 
        !props.ttsMuted
      ) {
        setTimeout(() => {
          speak(sendMessageResponse.llmResponse, { lang: props.moduleLanguage ? getSTTLangCode(props.moduleLanguage) : ttsLang });
        }, 100);
      }
    } else {
      /* Replace the temporary message with an error state if sending failed */
      console.log("Error sending message");
      setTitoMood("neutral");

      const errorMessage: ChatMessage = {
        value: "Sorry, I couldn't send your message. Please try again or refresh the page if the problem persists.",
        timestamp: new Date().toISOString(),
        source: "llm",
        metadata: undefined
      };

      const finalUserMessage: ChatMessage = {
        value: messageToSend,
        timestamp: tempUserChatMessage.timestamp,
        source: "user",
        metadata: { error: "Message failed to send" }
      };

      setChatMessages((prevChatMessages) => [...prevChatMessages.slice(0, -1), finalUserMessage, errorMessage]);
    }
  }

  /* Ask Tito for a language-specific prompt about a vocabulary word */
  function handleHintClick(word: string) {
    if (titoMood === "thinking" || listening) return;

    let promptText = "";
    const lang = props.moduleLanguage 
      ? props.moduleLanguage.toLowerCase() 
      : "en";

    if (lang === "es") {
      promptText = `¿Me puedes hacer una pregunta sobre '${word}'?`;
    } else if (lang === "fr") {
      promptText = `Peux-tu me poser une question sur '${word}' ?`;
    } else if (lang === "pt") {
      promptText = `Você pode me fazer uma pergunta sobre '${word}'?`;
    } else {
      promptText = `Can you ask me a question about '${word}'?`;
    }

    handleSendMessageClick(promptText, word);
  }

  /* Languages supported by speech recognition and text-to-speech */
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

  const getSTTLangCode = useCallback(
    (moduleLang: string): string => {
      const langMap: { [key: string]: string } = {
        es: "es-ES",
        fr: "fr-FR",
        pt: "pt-BR",
        en: "en-US"
      };
      
      return langMap[moduleLang.toLowerCase()] || "en-US";
    }, 
    []
  );

  const sttLang = 
    props.moduleID === -1 
      ? ttsLang 
      : (props.moduleLanguage 
        ? getSTTLangCode(props.moduleLanguage) 
        : ttsLang);

  /* Speech recognition state */ 
  const [sttSupported, setSttSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimSTT, setInterimSTT] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  /* Voice recording state */
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [wasVoiceMessage, setWasVoiceMessage] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const shouldAutoSendRef = useRef(false);
  const latestUserMessageRef = useRef<string>("");

  type SpeechRecognitionConstructor = new () => SpeechRecognition;


  const convertDigitsToWords = useCallback((text: string): string => {
    if (!text || typeof text !== "string") return text;

    const numberMappings: { [key: string]: { [key: string]: string } } = {
      "en-US": {
        "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
        "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
        "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
        "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
        "18": "eighteen", "19": "nineteen", "20": "twenty"
      },
      "es-ES": {
        "0": "cero", "1": "uno", "2": "dos", "3": "tres", "4": "cuatro",
        "5": "cinco", "6": "seis", "7": "siete", "8": "ocho", "9": "nueve",
        "10": "diez", "11": "once", "12": "doce", "13": "trece",
        "14": "catorce", "15": "quince", "16": "dieciséis", "17": "diecisiete",
        "18": "dieciocho", "19": "diecinueve", "20": "veinte"
      },
      "fr-FR": {
        "0": "zéro", "1": "un", "2": "deux", "3": "trois", "4": "quatre",
        "5": "cinq", "6": "six", "7": "sept", "8": "huit", "9": "neuf",
        "10": "dix", "11": "onze", "12": "douze", "13": "treize",
        "14": "quatorze", "15": "quinze", "16": "seize", "17": "dix-sept",
        "18": "dix-huit", "19": "dix-neuf", "20": "vingt"
      },
      "pt-BR": {
        "0": "zero", "1": "um", "2": "dois", "3": "três", "4": "quatro",
        "5": "cinco", "6": "seis", "7": "sete", "8": "oito", "9": "nove",
        "10": "dez", "11": "onze", "12": "doze", "13": "treze",
        "14": "quatorze", "15": "quinze", "16": "dezesseis", "17": "dezessete",
        "18": "dezoito", "19": "dezenove", "20": "vinte"
      }
    };

    const currentLangMap = numberMappings[sttLang] || numberMappings["en-US"];
    let result = text;

    try {
      const sortedNumbers = Object.keys(currentLangMap)
        .map(num => parseInt(num))
        .filter(num => num >= 10)
        .sort((a, b) => b - a);

      sortedNumbers.forEach(num => {
        const regex = new RegExp(`\\b${num}\\b`, "gi");
        result = result.replace(regex, currentLangMap[num.toString()]);
      });

      const singleDigits = Object.keys(currentLangMap)
        .map(num => parseInt(num))
        .filter(num => num < 10)
        .sort((a, b) => b - a);

      singleDigits.forEach(num => {
        const regex = new RegExp(`\\b${num}\\b`, "gi");
        result = result.replace(regex, currentLangMap[num.toString()]);
      });
    } catch (error) {
      console.warn("Error in number conversion:", error);
      return text;
    }

    return result;
  }, [sttLang]);

  /* Configure browser speech recognition */
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
  
    if (!SpeechRecognitionAPI) {
      return;
    }
  
    setSttSupported(true);
  
    const recognition: SpeechRecognition =
      new (SpeechRecognitionAPI as SpeechRecognitionConstructor)();
  
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = sttLang;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      console.log("[STT] Recognition ended");
      setListening(false);
    };
    recognition.onerror = (e: Event) => {
      console.warn("STT error:", e);
      setListening(false);
      shouldAutoSendRef.current = false;
    };
    recognition.onresult = (ev: Event) => {
      const event = ev as SpeechRecognitionEvent;
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }

      const processedInterim = convertDigitsToWords(interim);
      setInterimSTT(processedInterim);

      if (finalText) {
        const processedFinalText = convertDigitsToWords(finalText.trim());
        console.log("[STT] Final text captured:", processedFinalText);
        const newMessage = latestUserMessageRef.current?.trim() ? `${latestUserMessageRef.current} ${processedFinalText}` : processedFinalText;
        setUserMessage(newMessage);
        latestUserMessageRef.current = newMessage;
        setInterimSTT("");
        console.log("[STT] Message stored:", newMessage);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.abort(); } catch { }
      recognitionRef.current = null;
    };
  }, [sttLang, convertDigitsToWords]);

  /* Record spoken messages for pronunciation review */
  function startListening() {
    if (!sttSupported || !recognitionRef.current || listening) return;
    console.log("[STT] startListening called");
    try {
      latestUserMessageRef.current = userMessage;
      console.log("[STT] Stored current message:", userMessage);
      recognitionRef.current.start();
      startAudioRecording();
    } catch (e: unknown) {
      console.warn("[STT] Error starting recognition:", e);
    }
  }

  function stopListening() {
    if (!recognitionRef.current) return;
    console.log("[STT] stopListening called");
    try {
      recognitionRef.current.stop();
      stopAudioRecording();

      setTimeout(() => {
        const messageToSend = latestUserMessageRef.current.trim();
        if (messageToSend) {
          console.log("[STT] Sending message after stop:", messageToSend);
          handleSendMessageClick(messageToSend);
          latestUserMessageRef.current = "";
        } else {
          console.log("[STT] No message to send");
        }
      }, 300);
    } catch (err) {
      console.error("[STT] Error in stopListening:", err);
    }
  }

  async function startAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        console.log("[ChatScreen] Audio recording stopped, blob created:", {
          size: blob.size,
          type: blob.type,
          chunksCount: chunks.length
        });
        setAudioBlob(blob);
        setWasVoiceMessage(true);
        console.log("[ChatScreen] Audio states set: wasVoiceMessage=true, audioBlob size=", blob.size);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log("[ChatScreen] Started audio recording");
    } catch (error) {
      console.error("[ChatScreen] Error starting audio recording:", error);
    }
  }

  function stopAudioRecording() {
    console.log("[ChatScreen] stopAudioRecording called, current state:", {
      hasMediaRecorder: !!mediaRecorderRef.current,
      isRecording: isRecording,
      recorderState: mediaRecorderRef.current?.state
    });

    if (mediaRecorderRef.current && isRecording) {
      console.log("[ChatScreen] Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("[ChatScreen] MediaRecorder stopped, isRecording set to false");
    } else {
      console.log("[ChatScreen] stopAudioRecording: conditions not met for stopping");
    }
  }

  /* Track and persist the amount of time spent in the conversation */
  const saveTime = useCallback(async () => {
    if (user === undefined || props.chatbotId === undefined || timeChatted === undefined) return;

    const result = await incrementTime(user.jwt, user.userID, props.chatbotId, 0, timeChatted / 3600);

    if (result !== 200) {
      console.log("Failed updating timeSpent");
    }
  }, [user, props.chatbotId, timeChatted]);

  /* Load browser voices for Tito's text-to-speech narration */
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setTtsSupported(true);
    const synth = window.speechSynthesis;

    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

    /* Save conversation time when the module changes and once per minute */  useEffect(() => {
    saveTime();
    const interval = setInterval(() => {
      saveTime();
    }, 60000);
    return () => {
      clearInterval(interval);
    };
  }, [props.moduleID, saveTime]);

  useEffect(() => {
    const handleBeforeUnload = async (
      _event: BeforeUnloadEvent
    ) => {
      saveTime();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };

  }, [saveTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeChatted((prev) => (prev !== undefined ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeChatted === undefined) return;
    props.setTimeSpent(
      `${Math.floor(timeChatted / 3600)}h ` +
      `${Math.floor((timeChatted % 3600) / 60)}m ` +
      `${Math.floor(timeChatted % 60)}s`
    );
  }, [timeChatted, props]);

  /* Load vocabulary terms when the selected module changes */
  useEffect(() => {
    setTermsLoaded(false);

    if (props.moduleID === -1) {
      setTermsLoaded(true);
      setTerms([]);
      return;
    }

    if (userLoading || !user) return;

    const loadTerms = async () => {
      const fetchedTerms = await fetchModuleTerms(user.jwt, props.moduleID);

      if (fetchedTerms) {
        const uniqueTermsMap = new Map<string, Term>();

        fetchedTerms.forEach(term => {
          if (!uniqueTermsMap.has(term.questionFront)) {
            uniqueTermsMap.set(term.questionFront, {
              termID: term.termID,
              questionFront: term.questionFront,
              questionBack: term.questionBack,
              usageCount: 0
            });
          }
        });

        setTermsLoaded(true);
        setTerms(Array.from(uniqueTermsMap.values()));
      }
    };

    loadTerms();
  }, [props.moduleID, user, userLoading]);

  /* Prepare Tito's response for more natural speech synthesis */
  const preprocessForTTS = useCallback((text: string): string => {
    if (!text) return text;
    return text
      .replace(/[¡!]/g, match => match === '¡' ? '' : match)
      .replace(/[¿?]/g, match => match === '¿' ? '' : match)
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const speak = useCallback((text: string, opts?: { rate?: number; pitch?: number; lang?: string }) => {
    if (!ttsSupported || !text?.trim()) return;
    const processedText = preprocessForTTS(text);
    const lang = opts?.lang ?? ttsLang;

    const u = new SpeechSynthesisUtterance(processedText);
    u.rate = opts?.rate ?? 0.9;
    u.pitch = opts?.pitch ?? 1.0;
    u.volume = 0.8;
    u.lang = lang;

    const langCodePrefix = lang.toLowerCase();
    let selectedVoice = null;

    if (langCodePrefix.startsWith("en")) {
      const englishVoices = voices.filter(v => (v.lang || "").toLowerCase().startsWith("en"));
      selectedVoice = englishVoices.find(v => v.name.includes("Google")) ||
        englishVoices.find(v => v.name.includes("Zira")) ||
        englishVoices[0];
    } else {
      const langFamily = langCodePrefix.split("-")[0];
      const nativeVoices = voices.filter(v => {
        const voiceLang = (v.lang || "").toLowerCase();
        return voiceLang.startsWith(langFamily);
      });
      selectedVoice = nativeVoices.find(v => v.name.includes("Google")) ||
        nativeVoices.find(v => v.name.includes("Natural")) ||
        nativeVoices[0];
    }

    if (selectedVoice) u.voice = selectedVoice;

    console.log(`[TTS] Speaking with lang=${lang}, voice=${selectedVoice?.name || "default"}`);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [ttsSupported, ttsLang, voices, preprocessForTTS]);

  const handleTtsMute = () => {
    props.setTtsMuted((prev) => !prev);

    if (!props.ttsMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  /* Load the selected conversation's message history */
  useEffect(() => {
    setChatMessages([]);

    const welcomeMessageVal = props.titoWelcomeMessage || `Hi ${user?.username}, let's talk about ${props.moduleName || 'this topic'}! I'm Tito. Try to use each word from the vocabulary list at least 3 times. I'll help you practice.`;

    const instructionMessage: ChatMessage = props.moduleID !== -1 ? {
      value: welcomeMessageVal,
      timestamp: "",
      source: "llm",
      metadata: undefined
    } : {
      value: `Hi ${user?.username}, my name is Tito. Welcome to free chat, here you can ask questions or talk about whatever you like.`,
      timestamp: "",
      source: "llm",
      metadata: undefined
    };

    if (userLoading || !user || !props.chatbotId) return;

    console.log(`[ChatScreen] Loading messages for moduleID: ${props.moduleID}, chatbotId: ${props.chatbotId}`);

    const loadMessages = async () => {
      if (!props.chatbotId) return;
      const newMessages = await getMessages(user.jwt, user.userID, props.chatbotId, props.moduleID);
      if (newMessages) {
        console.log(`[ChatScreen] Loaded ${newMessages.length} messages for module ${props.moduleID}`);
        setChatMessages([instructionMessage, ...newMessages]);

        console.log("[ChatScreen] TTS Check:", {
          messageCount: newMessages.length,
          ttsSupported,
          ttsMuted: props.ttsMuted,
          willSpeak: newMessages.length === 0 && ttsSupported && !props.ttsMuted
        });

        if (newMessages.length === 0 && ttsSupported && !props.ttsMuted) {
          console.log("[ChatScreen] Speaking welcome message");
          setTimeout(() => { speak(instructionMessage.value, { lang: "en-US" }); }, 1000);
        } else {
          console.log("[ChatScreen] NOT speaking - messages exist or TTS is disabled");
        }
      } else {
        console.log(`[ChatScreen] Error getting messages for module ${props.moduleID}`);
        setChatMessages([instructionMessage]);
      }
    };
    loadMessages();
  }, [props.chatbotId, props.moduleID, user, userLoading, props.titoWelcomeMessage, props.moduleName]);

  const [placeholder, setPlaceholder] = 
  useState<string>("Tito is typing...");

  const fullPlaceholder = "Tito is typing...";

  /* Animate the typing placeholder while Tito prepares a response */
  useEffect(() => {
    const startThinking = () => {
      const repeatInterval = setInterval(() => {
        setPlaceholder("");
        let i = 0;
        const interval = setInterval(() => {
          setPlaceholder(() => fullPlaceholder.substring(0, i));
          i++;
          if (i >= fullPlaceholder.length) {
            clearInterval(interval);
          }
        }, 150);
        return () => clearInterval(interval);
      }, fullPlaceholder.length * 100 + 2000);

      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearInterval(repeatInterval);
        } else {
          clearInterval(repeatInterval);
          startThinking();
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
      };
      return () => {
        clearInterval(repeatInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    };
    if (titoMood === "thinking") {
      startThinking();
    }
  }, [titoMood, fullPlaceholder]);

  //Used to update averageScore
  useEffect(() => {
    const messagesWithScore = chatMessages.filter(
      (message) => message.metadata?.score !== undefined
    );

    const averageScore = 
        messagesWithScore.length > 0 
        ? messagesWithScore.reduce(
          (sum, msg) => sum + (msg.metadata?.score || 0), 
          0
        ) / messagesWithScore.length 
        : 0;

    props.setAverageScore(averageScore);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {showFireworks && <Fireworks />}
      <Image
        src={background}
        className="absolute inset-0 w-full h-full object-cover z-0"
        alt="Background"
      />
      <Image 
        src={palmTree} className="absolute right-0 bottom-0 z-10 w-[33.9%] h-auto select-none" 
        draggable={false} 
        alt="Decorative palm tree" 
      />
      <div className="flex flex-1 min-h-0 relative z-20">
        <div className="flex w-full flex-grow">
          <div className="flex flex-grow min-w-0 min-h-0 flex-col">
            {props.moduleID !== -1 && progress !== undefined && terms.length > 0 && (
              <div className="lg:hidden w-full flex justify-center px-2 shrink-0 -mb-10">
                <div className="w-full max-w-[260px]">
                  <VocabList 
                    wordsFront={terms.map(term => term.questionFront)} 
                    wordsBack={terms.map(term => term.questionBack)} 
                    usageCounts={terms.map(term => term.usageCount)} 
                    progress={progress}
                    termIDs={terms.map(t => t.termID)}
                    masteredTermIDs={masteredTermIDs}
                    onHintClick={handleHintClick}
                    onReset={handleReset}
                  />
                </div>
              </div>
            )}      

            <div className="flex-1 min-h-0 overflow-y-auto pl-3 pr-0 pt-3 pb-6 md:pl-4 md:pr-0 md:pt-4 md:pb-4">
              <Messages messages={chatMessages} chatFontSize={props.chatFontSize} isThinking={titoMood === "thinking"} />
            </div>

            <div className="w-full h-[96px] md:h-[120px] bg-[#8C7357] flex shrink-0 relative z-20">
              <div className="relative w-[72px] md:w-[110px] shrink-0 flex items-center justify-center">
                <Image
                  src={titoMood === "confused" ? confusedTito : titoMood === "happy" ? happyTito : titoMood === "thinking" ? thinkingTito : neutralTito}
                  style={{ width: titoMood === "confused" || titoMood === "happy" ? "85%" : "90%" }}
                  alt={`Tito is ${titoMood}`}
                  className={titoMood === "thinking" ? "tito-thinking" : ""}
                />
                <button
                  type="button"
                  onClick={handleTtsMute}
                  className="absolute bottom-1 -right-1 md:bottom-2 md:-right-0 w-6 h-6 md:w-8 md:h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition"
                  title={props.ttsMuted ? "Unmute Tito's voice" : "Mute Tito's voice"}
                >
                  <Image
                    src={props.ttsMuted ? muteIcon : volumeIcon}
                    alt={props.ttsMuted ? "Muted" : "Unmuted"}
                    className="w-7 h-7 md:w-7 md:h-7"
                  />
                </button>
              </div>

              <div className="flex-1 flex items-center gap-2 pr-2 pl-1 min-w-0">
                <textarea
                  placeholder={titoMood === "thinking" ? "Tito is thinking..." : listening ? "Listening..." : "Type here..."}
                  className="flex-1 min-w-0 h-[58%] md:h-[70%] bg-white rounded p-2 resize-none overflow-y-auto"
                  style={{
                    flex: "1 1 auto",
                    pointerEvents: titoMood === "thinking" || listening ? "none" : "auto",
                    opacity: titoMood === "thinking" || listening ? 0.75 : 1,
                    fontWeight: titoMood === "thinking" ? "bold" : "normal"
                  }}
                  disabled={titoMood === "thinking" || listening}
                  value={`${userMessage}${interimSTT ? (userMessage?.trim() ? " " : "") + interimSTT : ""}`}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessageClick();
                    }
                  }}
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!sttSupported) {
                        alert("Speech-to-text isn't supported in Firefox. Try Chrome or Edge.");
                        return;
                      }
                      if (!listening) startListening();
                      else stopListening();
                    }}
                    className={`flex items-center justify-center w-11 h-11 md:w-16 md:h-16 rounded-full shadow-sm transition ${listening ? "bg-red-500 text-white animate-pulse" : "bg-white/90 hover:bg-white"
                      }`}
                  >
                    <Image
                      src={micIcon}
                      alt="Tap to speak"
                      className="w-5 h-5 md:w-6 md:h-6 opacity-80 hover:opacity-100"
                    />
                  </button>

                  <button
                    onClick={() => handleSendMessageClick()}
                    className="w-11 h-11 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition shadow-sm"
                  >
                    <Image
                      src={sendMessageIcon}
                      className="w-7 h-7 md:w-10 md:h-10 rounded-full"
                      alt="Send message"
                    />
                  </button>

                  {props.moduleID === -1 && (
                    <select
                      value={ttsLang}
                      onChange={(e) => setTtsLang(e.target.value)}
                      className="w-[88px] md:w-32 h-10 md:h-12 rounded-full bg-white/80 hover:bg-white transition text-[11px] md:text-sm font-medium cursor-pointer px-2"
                    >
                      {SUPPORTED_LANGS.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          🌐 {lang.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {props.moduleID !== -1 && progress !== undefined && terms.length > 0 && (
            <div className="hidden lg:block w-[260px] xl:w-80 shrink-0 border-l-4 border-[#6B4F3A]/30">
              <VocabList
                wordsFront={terms.map(term => term.questionFront)}
                wordsBack={terms.map(term => term.questionBack)}
                usageCounts={terms.map(term => term.usageCount)}
                progress={progress}
                termIDs={terms.map(t => t.termID)}
                masteredTermIDs={masteredTermIDs}
                onHintClick={handleHintClick}
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}