"use client";

// React and Next.js imports
import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from "react";
import Image from "next/image";
import ReactHowler from 'react-howler';

// Authentication and services
import { useUser } from "@/hooks/useAuth";
import { 
  fetchModules, 
  fetchSessions, 
  deleteSession, 
  getChatbot, 
  fetchModuleTerms 
} from "@/services/TitoService";

// Child components
import ChatScreen from "@/components/TalkWithTito/ChatScreen";
import AnalyticsMenu from "@/components/TalkWithTito/AnalyticsMenu";
import UserBackground from "@/components/TalkWithTito/UserBackground";
import ModuleButton from "@/components/TalkWithTito/ModuleButton";
import Settings from "@/components/TalkWithTito/Settings";

// Styles
import "@/public/static/css/style.css";
import "@/lib/ionicons/css/ionicons.min.css";
import "@/lib/font-awesome/css/font-awesome.min.css";
import "@/public/static/css/talkwithtito.css";

// Image imports
import leaf_background from "@/public/static/images/ConversAItionELLE/coming_soon.png";
import tito_speak from "@/public/static/images/ConversAItionELLE/tito.png";
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png";
import chatBackground from "@/public/static/images/ConversAItionELLE/chatbackground.png";
import settingsIcon from "@/public/static/images/ConversAItionELLE/icon-settings.png";
import logoutIcon from "@/public/static/images/ConversAItionELLE/icon-log-out.png";
import play_button from "@/public/static/images/ConversAItionELLE/play.png";
import pause_button from "@/public/static/images/ConversAItionELLE/pause.png";
import next_button from "@/public/static/images/ConversAItionELLE/next.png";
import volume_button from "@/public/static/images/ConversAItionELLE/volume.png";
import mute_button from "@/public/static/images/ConversAItionELLE/mute.png";

interface Module {
  moduleID: number;
  name: string;
  language: string;
  isTitoEnabled?: boolean;
  classID?: number; // Track which class this module belongs to
  titoWelcomeMessage?: string;
}

interface Song {
  name: string;
  path: string;
}

// Music List
const songList = [ 
  { name: "Ambient Jungle", path: "/elle/TitoAudios/ambient-jungle.mp3" },
  { name: "Jungle Party", path: "/elle/TitoAudios/jungle-party.mp3" },
  { name: "Happy Rock", path: "/elle/TitoAudios/happy-rock.mp3" },
  { name: "Energetic Rock", path: "/elle/TitoAudios/energetic-rock.mp3" },
  { name: "Pop", path: "/elle/TitoAudios/pop-summer.mp3" },
  { name: "Techno", path: "/elle/TitoAudios/techno.mp3" },
  { name: "Hip Hop", path: "/elle/TitoAudios/hiphop.mp3" },
  { name: "R&B", path: "/elle/TitoAudios/rnb-beats.mp3"},
  { name: "Smooth Jazz", path: "/elle/TitoAudios/jazz-smooth.mp3" },
  { name: "Lofi", path: "/elle/TitoAudios/lofi-groovy.mp3" }
];

export default function TalkWithTito() {
  const titoStatements: string[] = ['Tito is creating a new dish...', 'Tito is freshening up...', 'Tito is taking a nap...'];
  const titoStatementsRef = useRef<string[]>(titoStatements);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [playClicked, setPlayClicked] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<number>(-1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userBackgroundFilepath, setUserBackgroundFilepath] = useState<string>("");
  const [userMusicFilepath, setUserMusicFilepath] = useState<string>("");
  const [AIChoice, setAIChoice] = useState<boolean>(false)
  const [userChatFont, setUserChatFont] = useState<string>("");
  const [analyticsActive, setAnalyticsActive] = useState<boolean>(false);
  const [ttsMuted, setTtsMuted] = useState<boolean>(true); // Default to muted (disabled)
  const { user, loading: userLoading } = useUser();
  const [timeSpent, setTimeSpent] = useState<string>("Loading...");
  const [termScore, setTermScore] = useState<string>("Loading...");
  const [averageScore, setAverageScore] = useState<number>(0.00);
  const [chatbotId, setChatbotId] = useState<number>();
  const [open, setOpen] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the conversation dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('.module-button-container')) {
          return;
        }
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  
  const [modules, setModules] = useState<Module[] | null>(null);

  // Animate Tito between the loading and ready states
  const handleTransition = () => {
    setIsFading(true);

    setTimeout(() => {
      setIsLoading((previousLoadingState) => !previousLoadingState);
      setIsFading(false);
    }, 700);

  };

  /* Load modules that have Tito enabled */
  useEffect(() => {
    if (userLoading || !user) {
      return;
    }

    const loadModules = async () => {
      const allModules = await fetchModules(user.jwt);

      const titoModules =
        allModules?.filter(
          (module) => module.isTitoEnabled
        ) ?? [];

      console.log("[TalkWithTito] Loaded modules:", {
        total: allModules?.length,
        titoEnabled: titoModules.length,
      });

      setModules(titoModules);
      setIsLoading(false);
    };

    void loadModules();
  }, [user, userLoading]);

  // Handles play button click
  const handlePlayClick = () => {
    if (!isLoading) setPlayClicked(true);
  };

  const openSettings = () => {
    setSettingsOpen((previousState) => !previousState);
  };

  const handleExitClick = () => {
    setPlayClicked(false);
  };

  const handleModuleClick = (moduleId: number) => {
    if (selectedModule === moduleId) {
      setDropdownOpen((previousState) => !previousState);
      return;
    }
  
    console.log(
      `[TalkWithTito] Switching to module ${moduleId}, resetting chatbot session`
    );
  
    setSelectedModule(moduleId);
    setChatbotId(undefined);
    setDropdownOpen(true);
  };

  const loadSessionsList = useCallback(async (moduleId: number) => {
    if (!user || userLoading) return;
    setSessionsLoading(true);
    try {
      console.log(`[TalkWithTito] Fetching sessions list for module ${moduleId}`);
      const sessionList = await fetchSessions(user.jwt, moduleId);
      if (sessionList) {
        setSessions(sessionList);
      }
    } catch (err) {
      console.error("[TalkWithTito] Error fetching sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (selectedModule !== undefined && selectedModule !== null) {
      setSessions([]);
      setChatbotId(undefined);
      loadSessionsList(selectedModule);
    }
  }, [selectedModule, loadSessionsList]);


  // Start a new conversation for the selected module 
  const handleStartNewConversation = async (
    moduleId: number
  ) => {
    if (!user || userLoading || isCreatingSession) {
      return;
    }

    setIsCreatingSession(true);

    try {
      console.log(
        `[TalkWithTito] Creating new conversation for module ${moduleId}`
      );

      let termsList: any[] = [];

      if (moduleId !== -1) {
        const fetchedTerms = await fetchModuleTerms(
          user.jwt,
          moduleId
        );

        if (fetchedTerms) {
          termsList = fetchedTerms.map((term) => ({
            termID: term.termID,
            questionFront: term.questionFront,
            questionBack: term.questionBack,
            used: false,
          }));
        }
      }
      
      const newChatbot = await getChatbot(
        user.jwt,
        user.userID,
        moduleId,
        termsList
      );
  
      if (!newChatbot) {
        alert(
          "Failed to start a new conversation. Please try again."
        );
        return;
      }
  
      console.log(
        `[TalkWithTito] New chatbot created: ${newChatbot.chatbotId}`
      );
  
      setChatbotId(newChatbot.chatbotId);
      void loadSessionsList(moduleId);
      setDropdownOpen(false);
    } catch (error) {
      console.error(
        "[TalkWithTito] Error starting new conversation:",
        error
      );
  
      alert(
        "An error occurred while creating a new conversation."
      );
    } finally {
      setIsCreatingSession(false);
    }
  };


  // Delete a saved conversation and refresh the session list
  const handleDeleteSession = async (
    event: React.MouseEvent,
    chatbotSID: number
  ) => {
    event.stopPropagation();

    if (!user) {
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this conversation? " +
        "This will permanently delete all messages in this chat."
    );

    if (!confirmDelete) {
      return;
    }

    try {
      console.log(
        `[TalkWithTito] Deleting session ${chatbotSID}`
      );

      const success = await deleteSession(
        user.jwt,
        chatbotSID
      );

      if (!success) {
        alert("Failed to delete the conversation.");
        return;
      }

      console.log(
        `[TalkWithTito] Session ${chatbotSID} deleted successfully`
      );

      if (chatbotId === chatbotSID) {
        setChatbotId(undefined);
      }

      void loadSessionsList(selectedModule);
    } catch (error) {
      console.error(
        "[TalkWithTito] Error deleting session:",
        error
      );

      alert(
        "An error occurred while deleting the conversation."
      );
    }
  };


 // Format a conversation timestamp for display
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "Unknown Date";
    }

    try {
      const date = new Date(dateString);

      return date.toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  // Render saved conversations for the selected module
  const renderSessionsDropdown = (moduleId: number) => {
    return (
      <div
        ref={dropdownRef}
        className="sessions-dropdown animate-fadeIn"
      >
        <div className="sessions-dropdown-title irish-grover">
          Tito&apos;s Chats
        </div>

        <button
          type="button"
          onClick={() => handleStartNewConversation(moduleId)}
          disabled={isCreatingSession}
          className="new-conversation-button irish-grover"
        >
          {isCreatingSession
            ? "Creating..."
            : "＋ New Chat"}
        </button>

        <div className="sessions-list scrollbar-thin">
          {sessionsLoading ? (
            <div className="sessions-status">
              <span
                className="sessions-loading-spinner"
                aria-hidden="true"
              />
              <span>Loading chats...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="sessions-empty-message">
              No previous chats yet.
            </div>
          ) : (
            sessions.map((session) => {
              const isActive =
                chatbotId === session.chatbotSID;

              return (
                <div
                  key={session.chatbotSID}
                  onClick={() => {
                    setChatbotId(session.chatbotSID);
                    setDropdownOpen(false);
                  }}
                  className={`session-card ${
                    isActive ? "session-card-active" : ""
                  }`}
                >
                  <div className="session-card-content">
                    <span className="session-card-title">
                      Chat #{session.chatbotSID}
                    </span>

                    <span className="session-card-date">
                      {formatDate(
                        session.creationTimestamp
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(event) =>
                      handleDeleteSession(
                        event,
                        session.chatbotSID
                      )
                    }
                    className="session-delete-button"
                    title="Delete conversation"
                    aria-label={`Delete conversation ${session.chatbotSID}`}
                  >
                    <span aria-hidden="true">🗑️</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Rotate Tito's loading messages every four seconds
  const [statement, setStatement] = useState(
    titoStatementsRef.current[0]
  );
  const [statementIndex, setStatementIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatement(
        titoStatementsRef.current[statementIndex]
      );

      setStatementIndex(
        (previousIndex) =>
          (previousIndex + 1) %
          titoStatementsRef.current.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [statementIndex]);

  /* Music playback state */
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [volume, setVolume] = useState(0.4);
  const [currentSongIndex, setCurrentSongIndex] =
    useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const howlerRef = useRef<ReactHowler>(null);

  const currentSong =
    playlist[currentSongIndex] ?? null;

  // Apply either Tito's music choice or the user's selected playlist
  const handlePlaylist = (songs: Song[]) => {
    if(AIChoice){
      handleAIMusic()
      setIsPlaying(true);
      setSettingsOpen(false);
    }
    else{
      setPlaylist(songs);
      setSettingsOpen(false)
      setIsPlaying(true)
    }
  };
  
  // Advance to the next song in the active playlist 
  const handleNextSong = () => {
    setIsPlaying(false);

    setCurrentSongIndex((previousIndex) => {
      return (previousIndex + 1) % playlist.length;
    });

    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  /* Pause or resume the current song */
  const togglePlayPause = () => {
    setIsPlaying((previousState) => !previousState);
  };

  const handleVolume = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVolume(Number.parseFloat(event.target.value));
  };

  const handleMute = () => {
    setVolume(0);
  };

  // Chat message font-size settings
  const [chatFont, setChatFont] = useState("");

  const handleFontSize = (fontChoice: string) => {
    setUserChatFont(fontChoice);

    let newFontSize = "24px";

    if (fontChoice === "small") {
      newFontSize = "14px";
    } else if (fontChoice === "medium") {
      newFontSize = "18px";
    } else if (fontChoice === "large") {
      newFontSize = "20px";
    }

    setChatFont(newFontSize);
  };

    /* Apply the music file selected by Tito */
    const handleAIMusic = () => {
      const titoChoice =
        `/elle/TitoAudios/${userMusicFilepath}`;

      const songChoice = songList.filter((song) =>
        titoChoice.includes(song.path)
      );

      setPlaylist(songChoice);
    };

    /* Show or hide the music credits */
    const toggleDropdown = () => {
      setOpen((previousState) => !previousState);
    };

    const creditsArrow = open ? "▲" : "▼";
  
    return (
      <div className="talkwithtito-body flex flex-col items-center w-full min-h-screen">
       {currentSong && (
          <ReactHowler
            key={currentSong.path}
            src={currentSong.path}
            playing={isPlaying}
            loop={false}
            volume={volume}
            onEnd={handleNextSong}
            ref={howlerRef}
          />
        )}
        <div className="relative w-full flex justify-center py-2 px-4">
          <div className="relative w-full max-w-[1200px] h-[calc(100dvh-150px)] md:h-[80dvh] border-2 border-black overflow-hidden flex flex-col md:flex-row bg-white">
            {settingsOpen && (
              <Settings
                apply={() => setSettingsOpen(false)}
                onSetPlaylist={handlePlaylist}
                onSetFont={handleFontSize}
                onSetAIChoice={setAIChoice}
                parentPlaylist = {playlist} 
                parentFont = {userChatFont}
                titoMusicChoice={AIChoice}
              />
            )}
            {!playClicked ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={leaf_background}
                  alt="TalkWithTito placeholder"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="z-0"
                />
                {isLoading ? (
                  <div className="relative w-[60%] h-[60%] md:w-[40%] md:h-[40%]">
                    <Image
                      src={tito_speak}
                      alt="TalkWithTito placeholder"
                      fill
                      style={{ objectFit: 'contain' }}
                      className={`transition-opacity duration-700 ${isFading ? "opacity-0" : "opacity-100"}`}
                    />
                  </div>
                ) : (
                  <div className="relative w-[50%] h-[50%] md:w-[35%] md:h-[35%]">
                    <Image
                      src={happyTito}
                      alt="Tito is ready"
                      fill
                      style={{ objectFit: 'contain' }}
                      className="pop-animation"
                    />
                  </div>
                )}
                <div
                  className={`absolute top-[11.5%] left-[50%] w-fit -translate-x-1/2 -translate-y-1/2 text-white text-xl 
                  md:text-4xl font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 irish-grover rounded-sm 
                  shadow-[0px_4px_4px_rgba(0,0,0,0.3)] transition-opacity duration-700
                  ${isFading ? "opacity-0" : "opacity-100"}`}
                >
                  {isLoading ? statement : "Talk with Tito"}
                </div>
                <div
                  className={`absolute top-[80%] left-[50%] w-fit -translate-x-1/2 -translate-y-1/2 text-white text-xl md:text-4xl 
                  font-bold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 rounded-sm irish-grover 
                  shadow-[0px_4px_4px_rgba(0,0,0,0.3)] transition-opacity duration-700
                  ${!isLoading ? "hover:bg-[#816031] hover:cursor-pointer" : ""}
                  ${isFading ? "opacity-0" : "opacity-100"}`}
                  onClick={handlePlayClick}
                >
                  {isLoading ? "Loading..." : "Play!"}
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row w-full h-full relative">
                <div className="music-settings z-50 scale-75 md:scale-100 origin-top-left">
                  <div className="music-controls-title irish-grover">
                    Music Controls:
                  </div>

                  <div className="music-controls-row">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="music-control-button"
                    >
                      {isPlaying ? (
                        <Image src={pause_button} alt="Pause music" />
                      ) : (
                        <Image src={play_button} alt="Play music" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextSong}
                      className="music-control-button"
                    >
                      <Image src={next_button} alt="Play next song" />
                    </button>

                    <button
                      type="button"
                      onClick={handleMute}
                      className="music-control-button"
                      aria-label={volume === 0 ? "Unmute music" : "Mute music"}
                    >
                      {volume === 0 ? (
                        <Image src={mute_button} alt="" />
                      ) : (
                        <Image src={volume_button} alt="" />
                      )}
                    </button>

                    <input
                      className="volume-slider"
                      id="volume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolume}
                      aria-label="Music volume"
                    />
                  </div>
                </div>

                {analyticsActive && (
                  <AnalyticsMenu 
                    timeSpent={timeSpent} 
                    termScore={termScore} 
                    averageScore={averageScore} 
                    chatbotId={chatbotId} 
                    isFreeTalk={selectedModule === -1} 
                    moduleId={selectedModule === -1 ? undefined : selectedModule} 
                    classId={modules?.find(m => m.moduleID === selectedModule)?.classID}
                    onClose={() => setAnalyticsActive(false)}
                  />
                )}
                
                <div className="flex-1 order-2 md:order-2 min-h-0 relative bg-white flex flex-col overflow-hidden">
                  <Image src={leaf_background} alt="TalkWithTito placeholder" fill style={{ objectFit: 'cover' }} className="z-0 opacity-20 md:hidden" />
                  {!selectedModule ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <div className="text-white text-sm md:text-3xl font-semibold bg-[#997c54] py-2 px-6 rounded shadow">
                        Welcome, {user?.username ? user.username : "<username>"}
                      </div>
                      <div className="relative w-32 h-32 md:w-40 md:h-40 my-6">
                        <Image src={happyTito} alt="Tito is ready" fill style={{ objectFit: 'contain' }} />
                      </div>
                      <div className="text-white text-sm md:text-2xl font-semibold bg-[#997c54] py-2 px-6 rounded shadow">
                        Pick a module to get started!
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex-shrink min-w-0 w-full h-full relative">
                      <ChatScreen 
                        moduleID={selectedModule}
                        moduleName={selectedModule === -1 ? undefined : modules?.find(m => m.moduleID === selectedModule)?.name} 
                        moduleLanguage={selectedModule === -1 ? undefined : modules?.find(m => m.moduleID === selectedModule)?.language}
                        setUserBackgroundFilepath={setUserBackgroundFilepath} 
                        setUserMusicFilepath={setUserMusicFilepath} 
                        setTermScore={setTermScore} 
                        setAverageScore={setAverageScore} 
                        chatbotId={chatbotId} 
                        setChatbotId={setChatbotId} 
                        chatFontSize={chatFont} 
                        setTimeSpent={setTimeSpent} 
                        ttsMuted={ttsMuted}
                        setTtsMuted={setTtsMuted}
                        sessions={sessions}
                        titoWelcomeMessage={selectedModule === -1 ? undefined : modules?.find(m => m.moduleID === selectedModule)?.titoWelcomeMessage}
                      />
                    </div>
                  )}
                </div>
  
                <div className="w-full md:w-[30%] order-1 md:order-1 h-[260px] md:h-full shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-black relative">
                  <Image src={chatBackground} alt="Chat Background" fill style={{ objectFit: 'cover' }} className="z-0" />
                  <div className="text-white w-full h-full relative z-10 flex flex-col justify-between">
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <UserBackground username={user?.username} backgroundFilepath={userBackgroundFilepath} />
                      <div className="w-full flex-1 flex flex-col items-center overflow-y-auto">
                        <div className="w-full relative flex flex-col items-center">
                          <ModuleButton key={-1} moduleName={"Free Chat"} onClick={() => handleModuleClick(-1)} isSelected={selectedModule === -1} />
                          {selectedModule === -1 && dropdownOpen && renderSessionsDropdown(-1)}
                        </div>
                        <div className="w-full py-2 flex justify-center irish-grover text-sm md:text-xl">Assigned modules:</div>
                        <div className="w-full flex flex-col items-center">
                          {modules?.map((module: Module, index) => (
                            <div key={index} className="w-full relative flex flex-col items-center">
                              <ModuleButton
                                moduleName={module.name || "Null"}
                                onClick={() => handleModuleClick(module.moduleID || -1)}
                                isSelected={module.moduleID === selectedModule}
                              />
                              {selectedModule === module.moduleID && dropdownOpen && renderSessionsDropdown(module.moduleID)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-12 md:h-[7.5%] flex justify-between items-center irish-grover text-xs md:text-xl border-t-2 border-white bg-black/20">
                      <button className="ml-2 flex items-center py-3" onClick={handleExitClick}>
                        <Image src={logoutIcon} alt="Exit" width={20} height={20} className="mr-2" />
                        <div className="hidden md:block">Exit Chat</div>
                      </button>
                      {selectedModule && <button onClick={() => setAnalyticsActive(!analyticsActive)}>Stats📊</button>}
                      <Image
                        src={settingsIcon}
                        alt="Settings"
                        className="mr-2 h-6 w-6 md:h-10 md:w-10 hover:cursor-pointer"
                        onClick={openSettings}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
  
        <div className="w-full max-w-5xl mt-10 md:mt-14 px-4 flex flex-col xl:flex-row gap-4 items-center xl:items-stretch justify-center">
          <div className="inter-font w-full lg:w-1/2 bg-[#9c7b4f] border-2 border-black rounded-xl p-4 md:p-6 text-white text-center overflow-y-auto">
            <h1 className="inter-font text-2xl md:text-3xl font-bold mb-3">
              Description</h1>
            <h3 className="text-sm md:text-base lg:text-lg mb-3">
              Tito is an AI parrot created to assist learners in developing stronger conversational skills in
              their target language.
            </h3>
            <p className="text-xs md:text-sm lg:text-base">
              Disclaimer: This chatbot is intended for educational and informational purposes only. While it aims
              to provide accurate and helpful responses, it may not always produce fully accurate or comprehensive
              information.
            </p>
          </div>

          <div className="inter-font w-full lg:w-[42%] bg-[#9c7b4f] border-2 border-black rounded-xl p-3 md:p-4 text-white text-center overflow-y-auto">
            <h1 className="inter-font mb-4 text-2xl md:text-3xl font-bold">
              Credits</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm md:text-base">
              <div>
                <h2 className="font-semibold mb-2 text-lg md:text-xl">Part 1</h2>
                <h3>John Fletcher Cabreara</h3>
                <h3>Layne Mazur</h3>
                <h3>Julianne Tomlinson</h3>
                <h3>Tina Tran</h3>
                <h3>Kylee Weener</h3>
                <h3>Logan Witte</h3>
              </div>

              <div>
                <h2 className="font-semibold mb-2 text-lg md:text-xl">Part 2</h2>
                <h3>Joshua Jarquin</h3>
                <h3>Fedor Kudinov</h3>
                <h3>Rodrigo Peixoto</h3>
                <h3>Wesley Underwood</h3>
              </div>

              <div>
                <h2 className="font-semibold mb-2 text-lg md:text-xl">Part 3</h2>
                <h3>Aneesh Vellanki</h3>
                <h3>Christian Estrada</h3>
                <h3>Saymon Rivas</h3>
                <h3>Sierra Huddle</h3>
                <h3>Zachary Trenary</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-5xl mt-4 px-4 flex justify-center">
          <div className="image-credits-box inter-font w-full max-w-[520px] sm:max-w-[560px] md:max-w-[620px] lg:max-w-[700px] bg-[#9c7b4f] border-2 border-black rounded-xl p-3 md:p-4 text-white text-center overflow-hidden shadow-md">
            <h1 className="inter-font text-2xl md:text-3xl font-bold mb-3">Image Credits</h1>

            <div className="text-sm md:text-base leading-relaxed">
              <p>Tito Character Images - Asher Moffitt</p>
              <p><a href="https://pixabay.com/vectors/leaves-foliage-tree-nature-autumn-6824098/">Leaf Image - Josef Mikulcik (Pixabay)</a></p>
              <p><a href="https://pixabay.com/vectors/coconut-palm-tree-coconut-tree-tree-7751862/">Palm Trees - Rama Widya (Pixabay)</a></p>
              <p><a href="https://pixabay.com/vectors/palm-leaves-palm-frond-palm-tree-32531/">Palm Leaves - Clker-Free-Vector-Images (Pixabay)</a></p>
            </div>

            <div className="text-center mt-3">
              <button
                className="text-lg sm:text-xl md:text-2xl p-2 max-w-full whitespace-normal break-words leading-tight"
                onClick={toggleDropdown}
              >
                Music Credits (Pixabay) {creditsArrow}
              </button>
            </div>

            {open && (
              <div className="text-xs sm:text-sm md:text-base leading-relaxed mt-2 break-words">
                <p>Ambient Jungle - <a href="https://pixabay.com/music/beats-ambient-jungle-quotambient-junglequot-by-storm-223660/">Ambient Jungle by Storm_Library</a></p>
                <p>Jungle Party - <a href="https://pixabay.com/music/afrobeat-jungle-party-156395/">Jungle Party by NoodlezStudios</a></p>
                <p>Happy Rock - <a href="https://pixabay.com/music/rock-happy-rock-308526/">Happy Rock by DmitryTaras</a></p>
                <p>Energetic Rock - <a href="https://pixabay.com/music/rock-energetic-sports-rock-music-311923/">Jungle Party by NoodlezStudios</a></p>
                <p>Pop - <a href="https://pixabay.com/music/upbeat-summer-pop-party-312159/">Summer Pop Party by EvgeniaCh</a></p>
                <p>Techno - <a href="https://pixabay.com/music/house-tech-house-model-student-16442/">Tech House-Model Student by AntipodeanWriter</a></p>
                <p>Hip Hop - <a href="https://pixabay.com/music/beats-sad-soul-chasing-a-feeling-185750/">Sad Soul (Chasing a Feeling) by AlexGrohl</a></p>
                <p>R&B - <a href="https://pixabay.com/music/beats-smoke-143172/">Smoke by SoulProdMusic</a></p>
                <p>Smooth Jazz - <a href="https://pixabay.com/music/smooth-jazz-guitar-jazz-2-311537/">Guitar jazz 2 by Surprising_Media</a></p>
                <p>Lofi - <a href="https://pixabay.com/music/beautiful-plays-lofi-vibes-113884/">Lofi Vibes by chill_background</a></p>
              </div>
            )}
          </div>
        </div>
      </div>
    );  
}