"use client"

//React imports
import { useState, useEffect, useRef } from "react";

// Their CSS files
import "@/public/static/css/style.css";
import "@/lib/ionicons/css/ionicons.min.css";
import "@/lib/font-awesome/css/font-awesome.min.css";
import { useUser } from "@/hooks/useAuth";

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

export default function TalkWithTito() {

  const titoStatements: string[] = ['Tito is creating a new dish...', 'Tito is freshening up...', 'Tito is taking a nap...'];
  const titoStatementsRef = useRef<string[]>(titoStatements);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [playClicked, setPlayClicked] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, loading: userLoading } = useUser();

  interface Module {
    moduleID: number;
    name: String;
    language: String;
  }

  const [modules, setModules] = useState<Module[] | null>(null);

  const handleLoading = () =>{
    setTimeout(() => {
      handleTransition()
    }, 5000);
  }

  // Handles tito transitions
  const handleTransition = () => {
    // Tito fade in and out
    setIsFading(true);

    //Tito pop in
    setTimeout(() => {
      setIsLoading(!isLoading);
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
      setIsLoading(false);
    }
  }, [user, userLoading]);

  useEffect(() => {
    modules?.forEach((module) => {
      console.log(module);
      console.log("ID / Name / Language:" + module.moduleID + " " + " " + module.name + " " + module.language);
    });
  }, [modules]);

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
  
  return (
    <div className="talkwithtito-body">
      <div className="relative w-full mt-0 mb-8 flex justify-center py-2">
        <button onClick={handleLoading} className="absolute top-10 right-0 w-10 h-10 bg-blue-700" />
        <div className="relative w-[60%] h-fit border-2 border-black">
          {settingsOpen && <Settings apply={() => setSettingsOpen(false)} />}
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
              <Image src={leaf_background} alt="TalkWithTito placeholder" className="game-background" />
              {!selectedModule ? <>
                <div className="absolute top-[11.5%] left-[62.5%] w-fit -translate-x-1/2 -translate-y-1/2 text-white md:text-4xl 
                font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 rounded-sm irish-grover
                shadow-[0px_4px_4px_rgba(0,0,0,0.3)]">
                  Welcome, [username]
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
                    Chat screen {selectedModule}
                  </div>
                </>}
              <div className="absolute top-0 left-0 h-full border-r-2 border-black w-[30%]">
                <Image src={chatBackground} alt="Chat Background" className="game-background" />
                <div className="text-white w-full h-full absolute top-0 left-0 flex flex-col justify-between"> {/*Username div (top)*/}
                  <div className="h-[92.5%]">
                    <div className="w-full h-[9.375%] py-[0.5em] flex justify-center irish-grover md:text-2xl border-b-2 border-white">
                      [username]
                    </div>
                    <div className="w-full h-[90.625%] flex flex-col items-center"> {/*Modules div (middle)*/}
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
                  <div className="w-full h-[7.5%] flex justify-between items-center irish-grover md:text-2xl border-t-2 border-white"> {/*Exit div (bottom)*/}
                    <button className="md:text-2xl ml-2 flex items-center py-3" onClick={handleExitClick}>
                      <Image src={logoutIcon} alt="Exit" className="mr-2" />
                      <div className="hidden md:block">Exit Chat</div>
                    </button>
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
          <p>Leaf Image - Josef Mikulcik (Pixabay)</p>
          <p>Palm Trees - Rama Widya (Pixabay)</p>
          <p>Palm Leaves - Clker-Free-Vector-Images (Pixabay)</p>
        </div>
      </div>
    </div>
  );
}
