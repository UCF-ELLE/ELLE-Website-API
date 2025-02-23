"use client"

// Their CSS files
import "@/public/static/css/style.css";
import "@/lib/ionicons/css/ionicons.min.css";
import "@/lib/font-awesome/css/font-awesome.min.css";

// Our CSS files
import "@/public/static/css/talkwithtito.css";

//Image imports
import coming_soon from "@/public/static/images/ConversAItionELLE/coming_soon.png";
import tito_speak from "@/public/static/images/ConversAItionELLE/tito.png";
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png";
import chatBackground from "@/public/static/images/ConversAItionELLE/chatbackground.png"
import settingsIcon from "@/public/static/images/ConversAItionELLE/icon-settings.png"
import logoutIcon from "@/public/static/images/ConversAItionELLE/icon-log-out.png"

// Component imports
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function TalkWithTito() {
  const titoStatements: string[] = ['Tito is creating a new dish...', 'Tito is freshening up...', 'Tito is taking a nap...']
  const titoStatementsRef = useRef<string[]>(titoStatements)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [playClicked, setPlayClicked] = useState<boolean>(false);

  //Handles play button click
  //Should fade out main menu and go to chatbot menu
  const handlePlayClick = () => {
    if (isLoading) {
      return;
    }
    else {
      setPlayClicked(true);
    }
  }

  const openSettings = () => {
    return;
  }

  const handleExitClick = () => {
    setPlayClicked(false);
  }

  // Cycle through Tito Statements (practice for loading screen)
  const [statement, setStatement] = useState<string>(titoStatementsRef.current[0]);
  const [index, setIndex] = useState<number>(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatement(titoStatementsRef.current[index]);
      setIndex((prev) => (prev + 1) % titoStatementsRef.current.length);
    }, 4000)

    return () => clearInterval(interval);
  }, [index])

  return (
    <div className="relative w-full mt-2 mb-2 flex justify-center">
      <button onClick={() => setIsLoading(!isLoading)} className="absolute top-10 right-0 w-10 h-10 bg-blue-700"></button>
      {!playClicked ?
        <div className="relative w-[80%] h-fit border-2 border-black"> {/*Main container for start menu*/}
          <Image src={coming_soon} alt="TalkWithTito placeholder" className="game-background" />
          {
            isLoading ?
              <Image src={tito_speak} alt="TalkWithTito placeholder" className="tito-overlay" />
              :
              <Image src={happyTito} alt="Tito is ready" className="absolute w-[35%] top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
          }
          <div className="absolute top-[11.5%] left-[50%] w-fit -translate-x-1/2 -translate-y-1/2
                        text-white text-2xl md:text-4xl font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 border-2 border-black rounded irish-grover">{isLoading ? statement : "Talk With Tito"}</div>
          <div className={`
                          absolute top-[80%] left-[50%] w-fit -translate-x-1/2 -translate-y-1/2
                        text-white md:text-4xl font-bold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 border-2 border-black rounded irish-grover
                          ${!isLoading ? "hover:bg-[#816031] hover:cursor-pointer" : ""}`}
            onClick={handlePlayClick}>
            {isLoading ? "Loading..." : "Play!"}
          </div>
        </div>
        :
        <div className="bg-white relative w-[80%] h-fit border-2 border-black"> {/*Main container for chat menu*/}
          <Image src={coming_soon} alt="TalkWithTito placeholder" className="game-background" />
            <div className="absolute top-[11.5%] left-[62.5%] w-fit -translate-x-1/2 -translate-y-1/2
            text-white md:text-4xl font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 border-2 border-black rounded irish-grover">Welcome, [username]</div>
            <Image src={happyTito} alt="Tito is ready" className="absolute w-[35%] top-[40%] left-[62.5%] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-[70%] left-[62.5%] w-fit -translate-x-1/2 -translate-y-1/2
            text-white md:text-4xl font-semibold whitespace-nowrap select-none bg-[#997c54] py-2 px-6 border-2 border-black rounded irish-grover">Pick a module to get started!</div>
          <div className="absolute top-0 left-0 h-full border-r-2 border-black">
            <Image src={chatBackground} alt="Chat Background" className="game-background" />
            <div className="text-white w-full h-full absolute top-0 left-0 flex flex-col justify-between">{/*Main container for text potion of chat menu*/}
              <div className="w-full py-[0.5em] flex justify-center irish-grover md:text-2xl border-b-2 border-white"> {/*Container for username section*/}
                [username]
              </div>
              <div className="w-full flex justify-center"></div>{/*Container for modules section*/}
              <div className="w-full flex justify-between items-center irish-grover md:text-2xl border-t-2 border-white">
                <button className="md:text-2xl ml-2 flex items-center py-3" onClick={handleExitClick}>
                  <Image src={logoutIcon} alt="Exit" className="mr-2"/>
                  <div className="hidden md:block">Exit Chat</div>
                </button>
                <Image src={settingsIcon} alt="Settings" className="mr-2 h-8 w-8 md:h-10 md:w-10 hover:cursor-pointer" onClick={openSettings}/>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  );
}