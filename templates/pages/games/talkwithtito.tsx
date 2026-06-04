"use client"

//React imports
import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/hooks/useAuth";
import ReactHowler from 'react-howler';
import UserBackground from "@/components/TalkWithTito/UserBackground";

// Their CSS files
import "@/public/static/css/style.css";
import "@/lib/ionicons/css/ionicons.min.css";
import "@/lib/font-awesome/css/font-awesome.min.css";

// Our CSS files
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

// Component imports
import ModuleButton from "@/components/TalkWithTito/ModuleButton";
import Settings from "@/components/TalkWithTito/Settings";

//Import frontend API calls
import { fetchModules, fetchSessions, deleteSession, getChatbot, fetchModuleTerms } from "@/services/TitoService";

import Image from "next/image";
import ChatScreen from "@/components/TalkWithTito/ChatScreen";
import AnalyticsMenu from "@/components/TalkWithTito/AnalyticsMenu";

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

  interface Module {
    moduleID: number;
    name: string;
    language: string;
    isTitoEnabled?: boolean;
    classID?: number; // Track which class this module belongs to
  }

  interface Song {
    name: string;
    path: string;
  }

  const [modules, setModules] = useState<Module[] | null>(
    // [{moduleID: 1, name: "Test module", language: "Spanish"}]
  );

  // Handles tito transitions
  const handleTransition = () => {
    // Tito fade in and out
    setIsFading(true);

    //Tito pop in
    setTimeout(() => {
      // if (user?.userID === 1 || user?.userID === 445){
        setIsLoading(!isLoading);
      // }
      setIsFading(false); // Restore opacity
    }, 700);

  };

  useEffect(() => {
    if (!userLoading && user) {
      const loadModules = async () => {
        const allModules = await fetchModules(user?.jwt);
        // Filter to only show Tito-enabled modules
        const titoModules = allModules?.filter(m => m.isTitoEnabled) || [];
        console.log('[TalkWithTito] Loaded modules:', { total: allModules?.length, titoEnabled: titoModules.length });
        setModules(titoModules);
      };
      loadModules();
      // if (user?.userID === 1 || user?.userID === 445){
        setIsLoading(false);
      // }
    }
  }, [user, userLoading]);

  // Handles play button click
  const handlePlayClick = () => {
    if (!isLoading) setPlayClicked(true);
  };

  const openSettings = () => {
    setSettingsOpen(!settingsOpen);
    return;
  };

  const handleExitClick = () => {
    setPlayClicked(false);
  };

  const handleModuleClick = (moduleId: number) => {
    if(selectedModule === moduleId) {
      setDropdownOpen(!dropdownOpen);
    }
    else {
      console.log(`[TalkWithTito] Switching to module ${moduleId}, resetting chatbot session`);
      setSelectedModule(moduleId);
      setChatbotId(undefined); // Reset chatbot session when switching modules
      setDropdownOpen(true);
    }
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

  const handleStartNewConversation = async (moduleId: number) => {
    if (!user || userLoading || isCreatingSession) return;
    setIsCreatingSession(true);
    try {
      console.log(`[TalkWithTito] Creating new conversation for module ${moduleId}`);
      let termsList: any[] = [];
      if (moduleId !== -1) {
        const fetchedTerms = await fetchModuleTerms(user.jwt, moduleId);
        if (fetchedTerms) {
          termsList = fetchedTerms.map(term => ({
            termID: term.termID,
            questionFront: term.questionFront,
            questionBack: term.questionBack,
            used: false
          }));
        }
      }
      
      const newChatbot = await getChatbot(user.jwt, user.userID, moduleId, termsList);
      if (newChatbot) {
        console.log(`[TalkWithTito] New chatbot created: ${newChatbot.chatbotId}`);
        setChatbotId(newChatbot.chatbotId);
        loadSessionsList(moduleId);
        setDropdownOpen(false); // Close dropdown on new session success
      } else {
        alert("Failed to start a new conversation. Please try again.");
      }
    } catch (err) {
      console.error("[TalkWithTito] Error starting new conversation:", err);
      alert("An error occurred while creating a new conversation.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, chatbotSID: number) => {
    e.stopPropagation();
    if (!user) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this conversation? This will permanently delete all messages in this chat.");
    if (!confirmDelete) return;
    
    try {
      console.log(`[TalkWithTito] Deleting session ${chatbotSID}`);
      const success = await deleteSession(user.jwt, chatbotSID);
      if (success) {
        console.log(`[TalkWithTito] Session ${chatbotSID} deleted successfully`);
        if (chatbotId === chatbotSID) {
          setChatbotId(undefined);
        }
        loadSessionsList(selectedModule);
      } else {
        alert("Failed to delete the conversation.");
      }
    } catch (err) {
      console.error("[TalkWithTito] Error deleting session:", err);
      alert("An error occurred while deleting the conversation.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Unknown Date";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderSessionsDropdown = (moduleId: number) => {
    return (
      <div 
        ref={dropdownRef}
        className="absolute top-[102%] left-[5%] w-[90%] bg-stone-900/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-3 z-50 flex flex-col items-center transition-all duration-200 ease-out animate-fadeIn"
      >
        <button
          onClick={() => handleStartNewConversation(moduleId)}
          disabled={isCreatingSession}
          className="w-full bg-[#997c54] hover:bg-[#816031] disabled:bg-stone-800 disabled:text-white/40 border border-white/10 text-white rounded-lg py-1.5 mb-2 text-xs font-semibold text-center hover:cursor-pointer transition-all flex items-center justify-center gap-1.5 irish-grover shadow-md"
        >
          {isCreatingSession ? "Creating..." : "➕ New Chat"}
        </button>

        <div className="w-full flex flex-col items-center max-h-[160px] overflow-y-auto scrollbar-thin gap-1">
          {sessionsLoading ? (
            <div className="text-[10px] text-white/50 py-2 flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Loading chats...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-[10px] text-white/40 italic py-2">No previous chats.</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.chatbotSID}
                onClick={() => {
                  setChatbotId(session.chatbotSID);
                  setDropdownOpen(false);
                }}
                className={`flex justify-between items-center w-full p-2 pl-3 rounded-lg text-[11px] transition-all cursor-pointer border
                            ${chatbotId === session.chatbotSID 
                              ? "bg-white/20 border-white/30 font-bold" 
                              : "bg-white/5 border-transparent hover:bg-white/15"}`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-white font-semibold">Chat #{session.chatbotSID}</span>
                  <span className="text-white/50 text-[8px] mt-0.5">{formatDate(session.creationTimestamp)}</span>
                </div>
                
                <button
                  onClick={(e) => handleDeleteSession(e, session.chatbotSID)}
                  className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Delete chat"
                >
                  <span className="text-[10px]">🗑️</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Cycle through Tito Statements
  const [statement, setStatement] = useState<string>(titoStatementsRef.current[0]);
  const [index, setIndex] = useState<number>(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatement(titoStatementsRef.current[index]);
      setIndex((prev) => (prev + 1) % titoStatementsRef.current.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [index]);



  // Music 

  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [volume, setVolume] = useState(0.4); // Set volume to be changeable by user later
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const howlerRef = useRef<ReactHowler>(null);

  // Ensure currentSongIndex does not break React
  const currentSong = playlist[currentSongIndex] || null;

  // Function to set playlist, start song, and close
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

  useEffect(() => {
    if (playlist.length > 0 && currentSongIndex >= 0 && isPlaying) {
      setIsPlaying(true); // Ensure playback starts once the song and playlist are updated
    }
  }, [playlist, currentSongIndex, isPlaying]);
  
  // Stops music, sets new song, and restarts music after a second
  const handleNextSong = () => {
    setIsPlaying(false)
    setCurrentSongIndex((prev) => {
      const nextIndex = (prev + 1) % playlist.length;
      return nextIndex;
    });
    setTimeout(() => {
      setIsPlaying(true); 
    }, 100); 
  };

  // Toggle music playing
  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  }

  const handleMute = () => {
    setVolume(0.0)
  }

  // Font Size
  const [chatFont, setChatFont] = useState<string>("");

    const handleFontSize = (chatFont:string) => {
      setChatFont(() => {
        setUserChatFont(chatFont)
        let newFont = "14px"; // Default value
    
        if (chatFont === "small") {
          newFont = "14px";
        } else if (chatFont === "medium") {
          newFont = "18px";
        } else if (chatFont === "large") {
          newFont = "20px";
        } else {
          newFont = "24px";
        }
        return newFont;
      });
    }

    // Handle music chosen by Tito
    const handleAIMusic = () => {
      console.log("AI called")
      const titoChoice = "/elle/TitoAudios/" + userMusicFilepath
      console.log(titoChoice)
      const songChoice = songList.filter((song) => titoChoice.includes(song.path));
      const songIndex = songList.findIndex((song) => song.path === titoChoice);
      console.log(songIndex)
      console.log(songChoice);
      setPlaylist(songChoice);
    }

    // useEffect(()=>{
    //   console.log(AIChoice)
    //   console.log(userMusicFilepath)
    // },[userMusicFilepath])

    // Music Credit dropdown
    const [triangle, setTriangle] = useState("▼")
    const toggleDropdown = () => {
      setOpen(!open);
      if (!open){
        setTriangle("▲")
      }
      else{
        setTriangle("▼")
      }
      
    }
  
  return (
    <div className="talkwithtito-body">
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
      <div className="relative w-full mt-0 mb-8 flex justify-center py-2">
        {/*Blue button (isLoading toggle for testing)*/}
        {/* <button onClick={handleTransition} className="absolute top-10 right-0 w-10 h-10 bg-blue-700" /> */}
        <div className="relative w-[60%] h-fit border-2 border-black">
          {settingsOpen && (
            <Settings
              apply={() => setSettingsOpen(false)}
              onSetPlaylist={handlePlaylist}
              onSetFont={handleFontSize}
              onSetAIChoice={setAIChoice}
              onSetTtsMuted={setTtsMuted}
              parentPlaylist = {playlist} 
              parentFont = {userChatFont}
              titoMusicChoice={AIChoice}
              ttsMuted={ttsMuted}
            />
          )}
          {!playClicked ? (
            <>
              <Image
                src={leaf_background}
                alt="TalkWithTito placeholder"
                className="game-background"
              />
              {isLoading ? (
                <Image
                  src={tito_speak}
                  alt="TalkWithTito placeholder"
                  className={`tito-overlay transition-opacity duration-700 ${isFading ? "opacity-0" : "opacity-100"}`}
                />
              ) : (
                <Image
                  src={happyTito}
                  alt="Tito is ready"
                  className="pop-animation absolute w-[35%] top-[22%] left-[32%] -translate-x-1/2 -translate-y-1/2"
                />
              )}
              <div
                className={`absolute top-[11.5%] left-[50%] w-fit -translate-x-1/2 -translate-y-1/2 text-white text-2xl 
                md:text-4xl font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 irish-grover rounded-sm 
                shadow-[0px_4px_4px_rgba(0,0,0,0.3)] transition-opacity duration-700
                ${isFading ? "opacity-0" : "opacity-100"}`}
              >
                {isLoading ? statement : "Talk with Tito"}
              </div>
              <div
                className={`absolute top-[80%] left-[50%] w-fit -translate-x-1/2 -translate-y-1/2 text-white md:text-4xl 
                font-bold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 rounded-sm irish-grover 
                shadow-[0px_4px_4px_rgba(0,0,0,0.3)] transition-opacity duration-700
                ${!isLoading ? "hover:bg-[#816031] hover:cursor-pointer" : ""}
                ${isFading ? "opacity-0" : "opacity-100"}`}
                onClick={handlePlayClick}
              >
                {isLoading ? "Loading..." : "Play!"}
              </div>
            </>
          ) : (
            <>
              <div className="music-settings">
                <button onClick={togglePlayPause}>
                  {isPlaying ? <Image src={pause_button} alt="pause"/>: <Image src={play_button} alt="play"/>}
                </button>
                <button onClick={handleNextSong}>
                  <Image src={next_button} alt="next button"/>
                </button>
                <label htmlFor="volume" style={{ paddingLeft: "1px" }} className="cursor-pointer" onClick={handleMute}>
                  {volume == 0.0 ? <Image src={mute_button} alt="mute music"/> : <Image src={volume_button} alt="volume control"/>}
                  </label>
                <input
                  className="volume-slider"
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolume}
                  
                />
              </div>
              {analyticsActive && <AnalyticsMenu timeSpent={timeSpent} termScore={termScore} averageScore={averageScore} chatbotId={chatbotId} isFreeTalk={selectedModule === -1} moduleId={selectedModule === -1 ? undefined : selectedModule} classId={modules?.find(m => m.moduleID === selectedModule)?.classID} />}
              <Image src={leaf_background} alt="TalkWithTito placeholder" className="game-background" />
              {chatbotId === undefined ? (
                <div className="absolute top-0 right-0 w-[70%] h-full flex flex-col justify-center items-center gap-6 p-6 select-none z-10">
                  <div className="text-white md:text-3xl font-semibold bg-[#997c54] py-2 px-6 rounded-sm irish-grover shadow-[0px_4px_4px_rgba(0,0,0,0.3)] text-center max-w-[90%]">
                    Welcome, {user?.username ? user.username : "<username>"}
                  </div>
                  <div className="w-[150px] md:w-[180px] h-auto relative my-2 animate-milderBounce">
                    <Image src={happyTito} alt="Tito is ready" className="w-full h-auto" />
                  </div>
                  <div className="text-white md:text-2xl font-semibold bg-[#997c54] py-2 px-6 rounded-sm shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover text-center max-w-[90%]">
                    {selectedModule === -1 ? "Pick a Free Chat conversation to begin!" : "Pick a conversation to begin!"}
                  </div>
                </div>
              ) : (
                <div className="absolute top-0 right-0 w-[70%] h-full bg-white">
                  <ChatScreen 
                    moduleID={selectedModule} 
                    moduleLanguage={selectedModule === -1 ? undefined : modules?.find(m => m.moduleID === selectedModule)?.language}
                    setUserBackgroundFilepath={setUserBackgroundFilepath} setUserMusicFilepath={setUserMusicFilepath} 
                    setTermScore={setTermScore} setAverageScore={setAverageScore} chatbotId={chatbotId} 
                    setChatbotId={setChatbotId} chatFontSize={chatFont} setTimeSpent={setTimeSpent} ttsMuted={ttsMuted}/>
                </div>
              )}
              <div className="absolute top-0 left-0 h-full border-r-2 border-black w-[30%]">
                <Image src={chatBackground} alt="Chat Background" className="game-background" />
                <div className="text-white w-full h-full absolute top-0 left-0 flex flex-col justify-between">
                  {/* Username div (top) */}
                  <div className="h-[92.5%]">
                    <UserBackground username={user?.username} backgroundFilepath={userBackgroundFilepath} />
                    <div className="w-full h-[71.75%] flex flex-col items-center">
                      {/* Modules div (middle) */}
                      <div className="w-full relative flex flex-col items-center">
                        <ModuleButton key={-1} moduleName={"Free Chat"} onClick={() => handleModuleClick(-1)} isSelected={selectedModule === -1} />
                        {selectedModule === -1 && dropdownOpen && renderSessionsDropdown(-1)}
                      </div>
                      <div className="w-full py-[0.2em] flex justify-center irish-grover md:text-xl">Assigned modules:</div>
                      <div className="w-full flex overflow-y-auto flex-col items-center">
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
                  <div className="w-full h-[7.5%] flex justify-between items-center irish-grover md:text-xl border-t-2 border-white">
                    {/* Exit div (bottom) */}
                    <button className="md:text-xl ml-2 flex items-center py-3" onClick={handleExitClick}>
                      <Image src={logoutIcon} alt="Exit" className="mr-2" />
                      <div className="hidden md:block">Exit Chat</div>
                    </button>
                    {selectedModule && <button onClick={() => setAnalyticsActive(!analyticsActive)}>Analytics📊</button>}
                    <Image
                      src={settingsIcon}
                      alt="Settings"
                      className="mr-2 h-8 w-8 md:h-10 md:w-10 hover:cursor-pointer"
                      onClick={openSettings}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
  
      </div>
      {/* Information Boxes */}
      <div className="info-container">
        <div className="info-box inter-font">
          <h1 className="inter-font">Description</h1>
          <h3>
            Tito is an AI parrot created to assist learners in developing stronger conversational skills in
            their target language.
          </h3>
          <p>
            Disclaimer: This chatbot is intended for educational and informational purposes only. While it aims
            to provide accurate and helpful responses, it may not always produce fully accurate or comprehensive
            information.
          </p>
        </div>
        <div className="info-box inter-font">
          <h1 className="inter-font mb-4 text-2xl font-bold">Credits</h1>

          <div className="grid grid-cols-2 gap-8 text-lg">
            {/* Part 1 */}
            <div>
              <h2 className="font-semibold mb-2">Part 1</h2>
                <h3>John Fletcher Cabreara</h3>
                <h3>Layne Mazur</h3>
                <h3>Julianne Tomlinson</h3>
                <h3>Tina Tran</h3>
                <h3>Kylee Weener</h3>
                <h3>Logan Witte</h3>
            </div>

            {/* Part 2 */}
            <div>
              <h2 className="font-semibold mb-2">Part 2</h2>
              <h3>Joshua Jarquin</h3>
              <h3>Fedor Kudinov</h3>
              <h3>Rodrigo Peixoto</h3>
              <h3>Wesley Underwood</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="info-container">
        <div className="info-box2 inter-font">
          <h1 className="inter-font">Image Credits</h1>
          <p>Tito Character Images - Asher Moffitt</p>
          <p><a href="https://pixabay.com/vectors/leaves-foliage-tree-nature-autumn-6824098/">Leaf Image - Josef Mikulcik (Pixabay)</a></p>
          <p><a href="https://pixabay.com/vectors/coconut-palm-tree-coconut-tree-tree-7751862/">Palm Trees - Rama Widya (Pixabay)</a></p>
          <p><a href="https://pixabay.com/vectors/palm-leaves-palm-frond-palm-tree-32531/">Palm Leaves - Clker-Free-Vector-Images (Pixabay)</a></p>
          <div className="text-center">
            <button className="text-2xl p-2" onClick={toggleDropdown}>Music Credits (Pixabay) {triangle}</button>
          </div>
          {open && (
            <div>
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