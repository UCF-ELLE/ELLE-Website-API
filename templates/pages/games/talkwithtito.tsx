"use client"

//React imports
import { useState, useEffect, useRef } from "react";
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

// Component imports
import ModuleButton from "@/components/TalkWithTito/ModuleButton";
import Settings from "@/components/TalkWithTito/Settings";

//Import frontend API calls
import { fetchModules } from "@/services/TitoService";

import Image from "next/image";
import ChatScreen from "@/components/TalkWithTito/ChatScreen";
import AnalyticsMenu from "@/components/TalkWithTito/AnalyticsMenu";

// Music List
// const songList = [ 
//   { name: "Ambient Jungle", path: "/elle/TitoAudios/ambient-jungle.mp3" },
//   { name: "Jungle Party", path: "/elle/TitoAudios/jungle-party.mp3" },
//   { name: "Happy Rock", path: "/elle/TitoAudios/happy-rock.mp3" },
//   { name: "Energetic Rock", path: "/elle/TitoAudios/energetic-rock.mp3" },
//   { name: "Pop", path: "/elle/TitoAudios/pop-summer.mp3" },
//   { name: "Techno", path: "/elle/TitoAudios/techno.mp3" },
//   { name: "HipHop", path: "/elle/TitoAudios/hiphop.mp3" },
//   { name: "R&B", path: "/elle/TitoAudios/rnb-beats.mp3"},
//   { name: "Smooth Jazz", path: "/elle/TitoAudios/jazz-smooth.mp3" },
//   { name: "Lofi", path: "/elle/TitoAudios/lofi-groovy.mp3" }
// ];

export default function TalkWithTito() {

  const titoStatements: string[] = ['Tito is creating a new dish...', 'Tito is freshening up...', 'Tito is taking a nap...'];
  const titoStatementsRef = useRef<string[]>(titoStatements);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [playClicked, setPlayClicked] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userBackgroundFilepath, setUserBackgroundFilepath] = useState<string>("");
  const [analyticsActive, setAnalyticsActive] = useState<boolean>(false);
  const { user, loading: userLoading } = useUser();
  const [timeSpent, setTimeSpent] = useState<string>("00d:00h:00m:00s");
  const [termScore, settermScore] = useState<string>("000/000");
  const [averageScore, setAverageScore] = useState<number>(0.00);

  interface Module {
    moduleID: number;
    name: String;
    language: String;
  }

  interface Song {
    name: string;
    path: string;
  }

  const [modules, setModules] = useState<Module[] | null>(
    /*[{moduleID: 1, name: "Test module", language: "Spanish"}]*/
  );

  const handleLoading = () =>{
    setTimeout(() => {
      handleTransition()
    }, 500);
  }

  // Handles tito transitions
  const handleTransition = () => {
    // Tito fade in and out
    setIsFading(true);

    //Tito pop in
    setTimeout(() => {
      if (user?.userID === 1){
        setIsLoading(!isLoading);
      }
      setIsFading(false); // Restore opacity
    }, 700);

  };

  useEffect(() => {
    if (!userLoading && user) {
      const loadModules = async () => {
        const modules = await fetchModules(user?.jwt);
        setModules(modules);
      };
      loadModules();
      if (user?.userID === 1){
        setIsLoading(false);
      }
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
    if(moduleId === -1) {
      return;
    }
    setSelectedModule(selectedModule === moduleId ? null : moduleId);
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
  
  // Function to set playlist, start song, and close
  const handlePlaylist = (songs: Song[]) => {
    setPlaylist(songs);
    setCurrentSongIndex(0);
    setSettingsOpen(false)
  };
  
  // Will probably change this functional code as current song index is less applicable after bug fixes
  const handleNextSong = () => {
    setCurrentSongIndex((prev) => {
      const nextIndex = (prev + 1) % playlist.length;
      return nextIndex;
    });
  };
  
  return (
    <div className="talkwithtito-body">
      {playlist.map((song, index) => (
        <ReactHowler
          key={song.path}
          src={song.path}
          playing={index === currentSongIndex}
          loop={false}
          volume={volume}
          onEnd={handleNextSong}
        />
      ))}
      <div className="relative w-full mt-0 mb-8 flex justify-center py-2">
        {/*Blue button (isLoading toggle for testing)*/}
        {/*<button onClick={handleLoading} className="absolute top-10 right-0 w-10 h-10 bg-blue-700" />*/}
        <div className="relative w-[60%] h-fit border-2 border-black">
          {settingsOpen && <Settings
            volume={volume}
            apply={() => setSettingsOpen(false)}
            onSetPlaylist={handlePlaylist}/>}
          {!playClicked ? (
            <>
              <Image src={leaf_background} alt="TalkWithTito placeholder" className="game-background" />
              {isLoading ? (
                <Image src={tito_speak} alt="TalkWithTito placeholder"
                  className={`tito-overlay transition-opacity duration-700 ${isFading ? "opacity-0" : "opacity-100"}`} />

              ) : (
                <>
                <Image
                    src={happyTito}
                    alt="Tito is ready"
                    className={`pop-animation absolute w-[35%] top-[22%] left-[32%] -translate-x-1/2 -translate-y-1/2`}
                  />
                </>
              )}
              <div className={`absolute top-[11.5%] left-[50%] w-fit -translate-x-1/2 -translate-y-1/2 text-white text-2xl 
              md:text-4xl font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 irish-grover rounded-sm 
              shadow-[0px_4px_4px_rgba(0,0,0,0.3)] transition-opacity duration-700
              ${isFading ? "opacity-0" : "opacity-100"}`}>
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
            </>) : (<>
              {analyticsActive && <AnalyticsMenu timeSpent={timeSpent} termScore={termScore} averageScore={averageScore}/>}
              <Image src={leaf_background} alt="TalkWithTito placeholder" className="game-background" />
              {!selectedModule ? <>
                <div className="absolute top-[11.5%] left-[62.5%] w-fit -translate-x-1/2 -translate-y-1/2 text-white md:text-4xl 
                font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 rounded-sm irish-grover
                shadow-[0px_4px_4px_rgba(0,0,0,0.3)]">
                  Welcome, {user?.username ? user.username : "<username>"}
                </div>
                <Image src={happyTito} alt="Tito is ready" className="absolute w-[35%] top-[40%] left-[62.5%] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-[70%] left-[62.5%] w-fit -translate-x-1/2 -translate-y-1/2 text-white md:text-4xl 
                font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 rounded-sm shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover">
                  Pick a module to get started!
                </div>
              </>
                :
                <>
                  <div className="absolute top-0 right-0 w-[70%] h-full bg-white">
                    <ChatScreen moduleID={selectedModule} setUserBackgroundFilepath={setUserBackgroundFilepath} setTermScore={settermScore} setAverageScore={setAverageScore}/>
                  </div>
                </>}
              <div className="absolute top-0 left-0 h-full border-r-2 border-black w-[30%]">
                <Image src={chatBackground} alt="Chat Background" className="game-background" />
                <div className="text-white w-full h-full absolute top-0 left-0 flex flex-col justify-between"> {/*Username div (top)*/}
                  <div className="h-[92.5%]">
                    <UserBackground username={user?.username} backgroundFilepath={userBackgroundFilepath} /> {/*TODO: Implement userBackground*/}
                    <div className="w-full h-[71.75%] flex flex-col items-center"> {/*Modules div (middle)*/}
                      <div className="w-full py-[0.2em] flex justify-center irish-grover md:text-xl">Assigned modules:</div>
                      <div className="w-full flex overflow-y-auto flex-col items-center">
                        {modules?.map((module: Module, index) => (
                          <ModuleButton 
                            key={index}
                            moduleName={module.name ? module.name : "Null"} 
                            onClick={() => handleModuleClick(module.moduleID ? module.moduleID : -1)} 
                            isSelected = {module.moduleID === selectedModule}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-[7.5%] flex justify-between items-center irish-grover md:text-xl border-t-2 border-white"> {/*Exit div (bottom)*/}
                    <button className="md:text-xl ml-2 flex items-center py-3" onClick={handleExitClick}>
                      <Image src={logoutIcon} alt="Exit" className="mr-2" />
                      <div className="hidden md:block">Exit Chat</div>
                    </button>
                    <button onClick={() => setAnalyticsActive(!analyticsActive)}>Analytics📊</button>
                    <Image
                      src={settingsIcon}
                      alt="Settings"
                      className="mr-2 h-8 w-8 md:h-10 md:w-10 hover:cursor-pointer"
                      onClick={openSettings}
                    />
                  </div>
                </div>
              </div>
            </>)}
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
          <h1 className="inter-font">Credits</h1>
          <h3>John Fletcher Cabreara</h3>
          <h3>Layne Mazur</h3>
          <h3>Julianne Tomlinson</h3>
          <h3>Tina Tran</h3>
          <h3>Kylee Weener</h3>
          <h3>Logan Witte</h3>
        </div>
      </div>
      <div className="info-container">
        <div className="info-box2 inter-font">
          <h1 className="inter-font">Image Credits</h1>
          <p>Tito Images - Asher Moffitt</p>
          <p>Leaf Image - Josef Mikulcik (Pixabay)</p>
          <p>Palm Trees - Rama Widya (Pixabay)</p>
          <p>Palm Leaves - Clker-Free-Vector-Images (Pixabay)</p>
        </div>
      </div>
    </div>
  );
}
