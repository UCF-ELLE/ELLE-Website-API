/* Imports */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useAuth";
import { fetchModuleTerms, getChatbot, getMessages, incrementTime, sendMessage, uploadAudioFile, ELLE_URL } from "@/services/TitoService";
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";
import volumeIcon from "@/public/static/images/ConversAItionELLE/volume.png";
import muteIcon from "@/public/static/images/ConversAItionELLE/mute.png";
// import TitoCloudBubble from "@/components/TalkWithTito/TitoCloudBubble";

/* Assets */
import background from "@/public/static/images/ConversAItionELLE/Graident Background.png";
import palmTree from "@/public/static/images/ConversAItionELLE/Palm Tree.png";
import sendMessageIcon from "@/public/static/images/ConversAItionELLE/send.png";
import micIcon from "@/public/static/images/ConversAItionELLE/mic.png";

/* Titos :D */
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png"; //LLM responded titoConfused=false
import neutralTito from "@/public/static/images/ConversAItionELLE/cropped_tito.png"; //Startup
import confusedTito from "@/public/static/images/ConversAItionELLE/confusedTito.png"; //LLM responded titoConfused=true
import thinkingTito from "@/public/static/images/ConversAItionELLE/respondingTito.png"; //LLM thinking

/* Components */
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

interface propsInterface {
  moduleID: number;
  moduleName?: string; // Name/topic of the module (e.g., 'La Comida')
  moduleLanguage?: string; // Language code of the module (e.g., 'es', 'fr', 'pt')
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
}

interface Term {
  termID: number;
  questionFront: string;
  questionBack: string;

  // CHANGED: track per-word progress instead of a boolean used flag
  usageCount: number;
}

// New interface for module progress map
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

    suffixes.forEach(suffix => {
      if (suffix.length >= base.length - 1 || base.length <= 2 || ['la', 'una', 'un', 'les', 'des'].includes(suffix.toLowerCase())) {
        options.push(suffix);
      } else {
        const endsWithVowel = isVowel(base[base.length - 1]);
        if (endsWithVowel && isVowel(suffix[0])) {
          options.push(base.slice(0, -1) + suffix);
        } else {
          options.push(base + suffix);
        }
      }
    });
    return options;
  });

  let phrases: string[][] = [[]];
  parts.forEach(options => {
    const nextPhrases: string[][] = [];
    phrases.forEach(p => {
      options.forEach(opt => {
        nextPhrases.push([...p, opt]);
      });
    });
    phrases = nextPhrases;
  });

  const finalVariations = new Set<string>();
  const l = lang.toLowerCase();

  phrases.forEach(phraseWords => {
    const phrase = phraseWords.join(' ');
    finalVariations.add(phrase);

    const inflectedWords = phraseWords.map(w => {
      const wOpts = new Set<string>([w]);
      const len = w.length;
      if (len <= 2) return Array.from(wOpts);

      const lastChar = w[len - 1].toLowerCase();

      if (l === 'es' || l === 'pt') {
        if (lastChar === 'o') {
          wOpts.add(w.slice(0, -1) + 'a');
          wOpts.add(w.slice(0, -1) + 'os');
          wOpts.add(w.slice(0, -1) + 'as');
        } else if (lastChar === 'a') {
          wOpts.add(w.slice(0, -1) + 'o');
          wOpts.add(w.slice(0, -1) + 'as');
          wOpts.add(w.slice(0, -1) + 'os');
        } else if (lastChar === 'e') {
          wOpts.add(w + 's');
        } else {
          wOpts.add(w + 'a');
          wOpts.add(w + 'es');
          wOpts.add(w + 'as');
        }
      } else if (l === 'fr') {
        if (lastChar === 'e') {
          wOpts.add(w + 's');
        } else {
          wOpts.add(w + 'e');
          wOpts.add(w + 's');
          wOpts.add(w + 'es');
        }
      } else {
        if (w.endsWith('y') && !/[aeiou]/i.test(w[len - 2] || '')) {
          wOpts.add(w.slice(0, -1) + 'ies');
        } else {
          wOpts.add(w + 's');
          wOpts.add(w + 'es');
        }
      }
      return Array.from(wOpts);
    });

    let phraseOpts: string[][] = [[]];
    inflectedWords.forEach(wOpts => {
      const nextPhraseOpts: string[][] = [];
      phraseOpts.forEach(p => {
        wOpts.forEach(o => {
          nextPhraseOpts.push([...p, o]);
        });
      });
      phraseOpts = nextPhraseOpts;
    });

    phraseOpts.forEach(p => finalVariations.add(p.join(' ')));
  });

  const articleRegex = /^(el|la|los|las|un|una|unos|unas|le|les|l'|une|des)\s+/i;
  finalVariations.forEach(variant => {
    if (articleRegex.test(variant)) {
      finalVariations.add(variant.replace(articleRegex, ""));
    }
  });

  return Array.from(finalVariations);
}

export default function ChatScreen(props: propsInterface) {
  const { user, loading: userLoading } = useUser();

  const [terms, setTerms] = useState<Term[]>([]);
  const [termsLoaded, setTermsLoaded] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [titoMood, setTitoMood] = useState("neutral");
  const [timeChatted, setTimeChatted] = useState<number | undefined>(undefined);

  // Replace single progress state with per‑module map
  const [moduleProgress, setModuleProgress] = useState<ModuleProgressMap>(() => {
    // Load persisted progress from localStorage if available
    try {
      const stored = localStorage.getItem("titoModuleProgress");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  // Derived progress for the currently selected module
  const progress = moduleProgress[props.moduleID] ?? 0;

  const [showFireworks, setShowFireworks] = useState(false);
  const prevProgress = useRef(progress);
  useEffect(() => {
    if (progress === 100 && prevProgress.current < 100) {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 4000);
    }
    prevProgress.current = progress;
  }, [progress]);

  const handleReset = useCallback(() => {
    setModuleProgress(prev => {
      const { [props.moduleID]: _, ...rest } = prev;
      return { ...rest, [props.moduleID]: 0 };
    });
    setTerms(prev =>
      prev.map(t => ({ ...t, usageCount: 0 }))
    );
  }, [props.moduleID]);

  // const [message, setMessage] = useState("");
  // const [trigger, setTrigger] = useState(0);
  const [masteredSet, setMasteredSet] = useState<Set<number>>(new Set());
  const [masteredTermIDs, setMasteredTermIDs] = useState<number[]>([]);
  const [classID, setClassID] = useState<string | null>(null);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const THRESHOLDS = useMemo(() => [25, 50, 75, 100] as const, []);
  const prevProgressRef = useRef<number>(-Infinity);

  type Threshold = 25 | 50 | 75 | 100;
  const [loreByThreshold, setLoreByThreshold] = useState<Partial<Record<Threshold, string>>>({});
  const [loreID, setLoreID] = useState<number | null>(null);

  useEffect(() => {
    prevProgressRef.current = -Infinity;
  }, [props.moduleID, loreID]);

  // Lore progress threshold popups disabled per sponsor feedback.
  /*
  useEffect(() => {
    if (progress == null || isNaN(progress)) return;
    if (!loreID) return;
  
    let chosen: number | null = null;
  
    for (const t of THRESHOLDS) {
      const key = `tito_lore_shown_${props.moduleID}_${loreID}_${t}`;
      const already = typeof window !== "undefined" && localStorage.getItem(key) === "1";
      if (!already && prevProgressRef.current < t && progress >= t) {
        if (chosen === null || t > chosen) chosen = t;
      }
    }
  
    if (chosen !== null) {
      const key = `tito_lore_shown_${props.moduleID}_${loreID}_${chosen}`;
      try { localStorage.setItem(key, "1"); } catch { }
      const text = loreByThreshold[chosen as Threshold];
      if (text) {
        setMessage(text);
        setTrigger(Date.now());
        console.log(`[Lore] Showing ${chosen}% lore`, { progress, chosen, text });
      } else {
        console.log(`[Lore] No lore text for ${chosen}%`);
      }
    }
  
    prevProgressRef.current = progress;
  }, [progress, props.moduleID, loreID, loreByThreshold, THRESHOLDS]);
  */

  // CHANGED: helper to support a few possible backend response shapes for per-term usage counts
  const applyBackendUsageCounts = useCallback((data: any) => {
    const usageArray =
      Array.isArray(data?.usageByTerm) ? data.usageByTerm :
        Array.isArray(data?.termUsageCounts) ? data.termUsageCounts :
          Array.isArray(data?.termProgress) ? data.termProgress :
            Array.isArray(data?.progress) ? data.progress :
              [];

    if (!Array.isArray(usageArray) || usageArray.length === 0) return false;

    const usageMap = new Map<number, number>();

    usageArray.forEach((item: any) => {
      const termID = Number(item?.termID ?? item?.termId ?? item?.id);
      const timesUsed = Number(
        item?.timesUsed ??
        item?.usageCount ??
        item?.count ??
        item?.times_used ??
        0
      );

      if (Number.isFinite(termID)) {
        usageMap.set(termID, Math.max(0, Math.min(3, timesUsed)));
      }
    });

    if (usageMap.size === 0) return false;

    setTerms((prevTerms) =>
      prevTerms.map((term) => ({
        ...term,
        usageCount: usageMap.has(term.termID)
          ? usageMap.get(term.termID) ?? 0
          : term.usageCount ?? 0,
      }))
    );

    return true;
  }, []);

  // CHANGED: this now fetches mastered IDs AND backend usage counts if the backend returns them
  const fetchTermProgress = useCallback(async () => {
    if (!user?.jwt || props.moduleID === -1) return;

    const url = `${ELLE_URL}/twt/session/getTermProgress?moduleID=${props.moduleID}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.jwt}`, Accept: "application/json" },
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "<no text>");
        console.error("[TermProgress] fetch failed", { status: res.status, url, bodyText });
        setMasteredSet(new Set());
        setMasteredTermIDs([]);
        return;
      }

      const payload = await res.json().catch(() => ({}));
      const data = payload?.data ?? payload ?? {};

      const ids: number[] = Array.isArray(data?.masteredIDs)
        ? data.masteredIDs.map(Number)
        : Array.isArray(data?.masteredTermIDs)
          ? data.masteredTermIDs.map(Number)
          : [];

      setMasteredSet(new Set(ids));
      setMasteredTermIDs(ids);

      applyBackendUsageCounts(data);

      console.log("[TermProgress] masteredIDs =", ids);
    } catch (err) {
      console.error("[TermProgress] unexpected error calling", url, err);
      setMasteredSet(new Set());
      setMasteredTermIDs([]);
    }
  }, [user?.jwt, props.moduleID, applyBackendUsageCounts]);

  const fetchProgress = useCallback(async () => {
    if (!user?.jwt) return;

    // Use the same endpoint that provides per‑term usage counts
    const url = `${ELLE_URL}/twt/session/getTermProgress?moduleID=${props.moduleID}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.jwt}`, Accept: "application/json" },
      });
      if (!res.ok) {
        console.error(`[fetchProgress] failed ${res.status}`);
        return;
      }
      const payload = await res.json();
      const data = payload?.data ?? payload ?? {};

      // Build a map of termID -> usageCount (0‑3)
      const usageMap = new Map<number, number>();
      const usageArray = Array.isArray(data?.usageByTerm)
        ? data.usageByTerm
        : Array.isArray(data?.termUsageCounts)
          ? data.termUsageCounts
          : Array.isArray(data?.termProgress)
            ? data.termProgress
            : [];
      usageArray.forEach((item: any) => {
        const termID = Number(item?.termID ?? item?.termId ?? item?.id);
        const count = Math.max(0, Math.min(3, Number(item?.timesUsed ?? item?.usageCount ?? item?.count ?? 0)));
        if (Number.isFinite(termID)) usageMap.set(termID, count);
      });

      // Merge with current terms state (if any)
      setTerms(prev =>
        prev.map(t => ({
          ...t,
          usageCount: usageMap.has(t.termID) ? usageMap.get(t.termID)! : t.usageCount ?? 0,
        }))
      );

      // Compute progress from merged terms
      const total = terms.length || usageMap.size;
      const mastered = Array.from(usageMap.values()).filter(c => c >= 3).length;
      const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
      // Update per‑module progress map, keeping the highest value
      setModuleProgress(prev => ({
        ...prev,
        [props.moduleID]: Math.max(prev[props.moduleID] ?? 0, pct),
      }));
      // Update term score if server indicates more mastery
      props.setTermScore(`${mastered} / ${total}`);
      console.log("[fetchProgress] updated", { mastered, total, pct });
    } catch (err) {
      console.error("[fetchProgress] error", err);
    }
  }, [user?.jwt, props.moduleID, props, terms]);

  useEffect(() => {
    if (!user || !user.jwt) return;

    const jwt = user.jwt;

    async function getClassIdForModule(moduleID: number): Promise<string | null> {
      const res = await fetch(`${ELLE_URL}/twt/session/access`, {
        headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
      });
      if (!res.ok) return null;

      const data = await res.json();
      const pairs = data?.data ?? data;
      for (const [cID, modulesList] of pairs) {
        for (const [mID] of modulesList) {
          if (mID === props.moduleID) return String(cID);
        }
      }
      return null;
    }

    async function fetchLoreFromDB() {
      try {
        const classIDForModule = await getClassIdForModule(props.moduleID);
        if (!classIDForModule) {
          console.warn(`[Lore] No classID found for module ${props.moduleID} - lore feature will not be available`);
          setLoreByThreshold({});
          setLoreID(null);
          setClassID(null);
          return;
        }

        setClassID(classIDForModule);

        const res = await fetch(
          `${ELLE_URL}/twt/session/getTitoLore?classID=${classIDForModule}&moduleID=${props.moduleID}`,
          { headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" } }
        );
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Lore fetch failed ${res.status}: ${body}`);
        }

        const payload = await res.json();

        const arr: string[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload) ? payload : [];

        console.log("[Lore] Normalized data array", { length: arr.length, arr });

        const seqToThreshold: Threshold[] = [25, 50, 75, 100];
        const map: Partial<Record<Threshold, string>> = {};

        arr.forEach((txt, i) => {
          const t = seqToThreshold[i];
          if (t && typeof txt === "string") {
            const clean = txt.trim();
            console.log("[Lore] Mapping item", { index: i, threshold: t, raw: txt, clean });
            if (clean) map[t] = clean;
          }
        });

        const have = Object.keys(map).map(Number);
        const missing = seqToThreshold.filter(t => !have.includes(t));
        if (missing.length) {
          console.warn("[Lore] Missing thresholds", { missing, have, map });
        } else {
          console.log("[Lore] All thresholds mapped OK", { have, map });
        }

        setLoreByThreshold(map);
        const idNum = Number(payload?.loreID);
        setLoreID(Number.isFinite(idNum) ? idNum : null);

        console.log("[Lore] Loaded", {
          loreID: Number.isFinite(idNum) ? idNum : null,
          thresholds: Object.keys(map),
          map,
          raw: payload,
        });
      } catch (e) {
        console.error("Lore fetch error:", e);
        setLoreByThreshold({});
        setLoreID(null);
      }
    }

    fetchProgress();
    fetchTermProgress();
    // fetchLoreFromDB(); // Lore disabled per sponsor feedback
  }, [props.moduleID, user?.jwt, fetchProgress, fetchTermProgress]);

  async function handleSendMessageClick(forcedMessage?: string | React.MouseEvent, hintWord?: string) {
    const isString = typeof forcedMessage === "string";
    const messageToUse = (isString ? forcedMessage : userMessage) as string;

    if (messageToUse === "" || user === undefined || props.chatbotId === undefined || !termsLoaded) {
      console.log(`[ChatScreen] Send blocked - message: '${messageToUse}', user: ${!!user}, chatbotId: ${props.chatbotId}, termsLoaded: ${termsLoaded}`);
      return;
    }

    setTitoMood("thinking");
    const messageToSend = messageToUse;
    setUserMessage("");

    const tempUserChatMessage: ChatMessage = {
      value: messageToSend,
      timestamp: new Date().toISOString(),
      source: "user",
      metadata: undefined
    };
    setChatMessages((prevChatMessages) => [...prevChatMessages, tempUserChatMessage]);

    const sendMessageResponse = await sendMessage(
      user.jwt,
      user.userID,
      props.chatbotId,
      props.moduleID,
      messageToSend,
      terms.map(term => term.questionFront),

      // CHANGED: only send words that are fully completed under the 3-use rule
      terms.filter(term => term.usageCount >= 3).map(term => term.questionFront),

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

      // CHANGED: keep a fast optimistic update for UI responsiveness
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^\w\sáéíóúüñàèìòùâêîôûçäëïöüß]/g, "").trim();

      const messageWords = messageToSend
        .trim()
        .split(/\s+/)
        .map(normalize);

      const usageArray =
        Array.isArray(sendMessageResponse?.usageByTerm) ? sendMessageResponse.usageByTerm :
          Array.isArray(sendMessageResponse?.termUsageCounts) ? sendMessageResponse.termUsageCounts :
            Array.isArray(sendMessageResponse?.termProgress) ? sendMessageResponse.termProgress :
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

        // CHANGED: if backend already returned exact usage counts, trust that first
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

      // CHANGED: progress only increases when a vocab word reaches 3/3
      {
        const completedCount = newTerms.filter(t => t.usageCount >= 3).length;
        const totalCount = newTerms.length || 0;
        const pctLocal =
          totalCount > 0 ? Math.max(0, Math.min(100, Math.round((100 * completedCount) / totalCount))) : 0;

        console.log("[progress] optimistic local", { completedCount, totalCount, pctLocal });
        // Update per‑module progress map with optimistic value (max to avoid regress)
        setModuleProgress(prev => ({
          ...prev,
          [props.moduleID]: Math.max(prev[props.moduleID] ?? 0, pctLocal),
        }));
      }



      if (sendMessageResponse.llmResponse && ttsSupported && !props.ttsMuted) {
        setTimeout(() => {
          speak(sendMessageResponse.llmResponse, { lang: props.moduleLanguage ? getSTTLangCode(props.moduleLanguage) : ttsLang });
        }, 100);
      }
    } else {
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

  function handleHintClick(word: string) {
    if (titoMood === "thinking" || listening) return;

    let promptText = "";
    const lang = props.moduleLanguage ? props.moduleLanguage.toLowerCase() : "en";
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

  const getSTTLangCode = useCallback((moduleLang: string): string => {
    const langMap: { [key: string]: string } = {
      es: "es-ES",
      fr: "fr-FR",
      pt: "pt-BR",
      en: "en-US"
    };
    return langMap[moduleLang.toLowerCase()] || "en-US";
  }, []);

  const sttLang = props.moduleID === -1 ? ttsLang : (props.moduleLanguage ? getSTTLangCode(props.moduleLanguage) : ttsLang);

  const [sttSupported, setSttSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimSTT, setInterimSTT] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSttSupported(true);
    const rec: SpeechRecognition = new (SR as SpeechRecognitionConstructor)();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = sttLang;

    rec.onstart = () => setListening(true);
    rec.onend = () => {
      console.log("[STT] Recognition ended");
      setListening(false);
    };
    rec.onerror = (e: Event) => {
      console.warn("STT error:", e);
      setListening(false);
      shouldAutoSendRef.current = false;
    };
    rec.onresult = (ev: Event) => {
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

    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch { }
      recognitionRef.current = null;
    };
  }, [sttLang, convertDigitsToWords]);

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

  const saveTime = useCallback(async () => {
    if (user === undefined || props.chatbotId === undefined || timeChatted === undefined) return;

    const result = await incrementTime(user.jwt, user.userID, props.chatbotId, 0, timeChatted / 3600);

    if (result !== 200) {
      console.log("Failed updating timeSpent");
    }
  }, [user, props.chatbotId, timeChatted]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setTtsSupported(true);
    const synth = window.speechSynthesis;

    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    saveTime();
    const interval = setInterval(() => {
      saveTime();
    }, 60000);
    return () => {
      clearInterval(interval);
    };
  }, [props.moduleID, saveTime]);

  useEffect(() => {
    const handleBeforeUnload = async (_event: BeforeUnloadEvent) => {
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

  // CHANGED: dedupe duplicate vocab words and start each unique word at 0/3
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

  // Toggles Tito's narration on/off from the button near Tito.
  // If currently speaking and the user mutes, stop speech immediately.
  const handleTtsMute = () => {
    props.setTtsMuted((prev) => !prev);

    if (!props.ttsMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    const isFreeChat = props.moduleID === -1;
    if (userLoading || !user || !termsLoaded || (!isFreeChat && terms.length === 0)) return;

    console.log(`[ChatScreen] Initializing chatbot for module ${props.moduleID}`, { termsLength: terms.length, isFreeChat });

    const loadChatbot = async () => {
      console.log(`[ChatScreen] Calling getChatbot for module ${props.moduleID}`);
      const newChatbot = await getChatbot(user.jwt, user.userID, props.moduleID, terms);
      if (newChatbot) {
        console.log(`[ChatScreen] Successfully got chatbot session ${newChatbot.chatbotId} for module ${props.moduleID}`);
        props.setChatbotId(newChatbot.chatbotId);
        setTimeChatted(newChatbot.totalTimeChatted * 3600);

        if (newChatbot.userBackground) {
          console.log("Received LLM Background: " + newChatbot.userBackground);
          props.setUserBackgroundFilepath(newChatbot.userBackground);
        }

        if (newChatbot.userMusicChoice) {
          console.log("Received Music Background: " + newChatbot.userMusicChoice);
          props.setUserMusicFilepath(newChatbot.userMusicChoice);
        }

        // CHANGED: removed localStorage restore because backend should now be source of truth
        // Fallback still supports old backend that only returns termsUsed
        const usageApplied = applyBackendUsageCounts(newChatbot);

        if (!usageApplied) {
          const newTerms: Term[] = terms.map(term => {
            const backendCount =
              newChatbot.termsUsed?.filter((w: string) => w === term.questionFront).length ?? 0;

            return {
              termID: term.termID,
              questionFront: term.questionFront,
              questionBack: term.questionBack,
              usageCount: Math.min(Math.max(backendCount, 0), 3),
            };
          });

          setTerms(newTerms);
        }

        // CHANGED: fetch dedicated term progress endpoint so exact backend counts overwrite fallback data
        await fetchTermProgress();
      } else {
        console.error(`[ChatScreen] Failed to get chatbot for module ${props.moduleID}`);
        props.setChatbotId(undefined);
      }
    };
    loadChatbot();
  }, [props.moduleID, user?.jwt, termsLoaded]); // CHANGED: kept dependencies simple to avoid render loops

  useEffect(() => {
    setChatMessages([]);

    const instructionMessage: ChatMessage = props.moduleID !== -1 ? {
      value: `Hi ${user?.username}, let's talk about ${props.moduleName || 'this topic'}! I'm Tito. Try to use each word from the vocabulary list at least 3 times. I'll help you practice.`,
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
  }, [props.chatbotId, props.moduleID, user, userLoading]);

  // Persist module progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("titoModuleProgress", JSON.stringify(moduleProgress));
    } catch { }
  }, [moduleProgress]);

  const [placeholder, setPlaceholder] = useState<string>("Tito is typing...");
  const fullPlaceholder = "Tito is typing...";

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

  // Lore startup messages disabled per sponsor feedback
  /*
  useEffect(() => {
    setMessage("I… I think I’ve lost my memories.");
    setTrigger(Date.now());

    const timer = setTimeout(() => {
      setMessage("Can you talk with me in different languages to help me remember them?");
      setTrigger(Date.now());
    }, 8000);

    return () => clearTimeout(timer);
  }, []);
  */



  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {showFireworks && <Fireworks />}
      {/*Outer container div*/}
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
      {/*<button className="absolute right-0 top-0 z-[1000] w-[5%] h-[5%] bg-red-500 opacity-50 hover:opacity-100" onClick={handleTestClick}/>*/}
           {/* Main content area */}
           <div className="flex flex-1 min-h-0 relative z-20">
            <div className="flex w-full flex-grow">
            {/* Left + center area */}
            <div className="flex flex-grow min-w-0 min-h-0 flex-col">
              {/* Mobile vocab panel */}
                {props.moduleID !== -1 && progress !== undefined && terms.length > 0 && (
                  <div className="lg:hidden w-full flex justify-center pt-2 px-2 shrink-0">
                    <div className="w-full max-w-[260px]">
                      <VocabList 
                        wordsFront={terms.map(term => term.questionFront)} 
                        wordsBack={terms.map(term => term.questionBack)} 
                        usageCounts={terms.map(term => term.usageCount)} 
                        progress={progress}
                        termIDs={terms.map(t => t.termID)}
                        masteredTermIDs={masteredTermIDs}
                      />
                    </div>
                  </div>
                )}

              {/* Messages area */}
              <div className="flex-1 min-h-0 overflow-y-auto pl-3 pr-0 pt-3 pb-6 md:pl-4 md:pr-0 md:pt-4 md:pb-4">
                <Messages messages={chatMessages} chatFontSize={props.chatFontSize} />
              </div>
            

            {/* Messages area */}
            <div className="flex-1 min-h-0 overflow-y-auto pl-3 pr-0 pt-3 pb-6 md:pl-4 md:pr-0 md:pt-4 md:pb-4">
              <Messages messages={chatMessages} chatFontSize={props.chatFontSize} />
            </div>

            {/* Chat box */}
            <div className="w-full h-[96px] md:h-[120px] bg-[#8C7357] flex shrink-0 relative z-20">
              {/*Tito Image Div */}
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
                {/* Lore bubble disabled per sponsor feedback */}
                {/* <TitoCloudBubble message={message} trigger={trigger} /> */}
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

                {/*Button Container */}
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
        </div>

        {/* Right vocab panel for desktops/tablets */}
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
  )

}