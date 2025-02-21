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

// Component imports
import {useState, useEffect, useRef} from "react";
import Image from "next/image";




export default function TalkWithTito(){
  const titoStatements:string[] = ['Tito is creating a new dish...', 'Tito is freshening up...', 'Tito is taking a nap...']
  const titoStatementsRef = useRef<string[]>(titoStatements)
  const [isLoading, setIsLoading] = useState(false);

  //Handles play button click
  const handlePlayClick = () => {
    if(isLoading) {
      return;
    }
    else {

    }
  }

  // Cycle through Tito Statements (practice for loading screen)
  const [statement, setStatement] = useState<string>(titoStatementsRef.current[0]);
  const [index, setIndex] = useState<number>(1);

  useEffect(()=>{
    const interval = setInterval(()=>{
      setStatement(titoStatementsRef.current[index]);
      setIndex((prev)=> (prev+1) % titoStatementsRef.current.length);
    }, 4000)

    return () => clearInterval(interval);
  }, [index])

  return (
      <div className="relative w-full mt-2 mb-2 flex justify-center">
        <div className="relative w-[80%] h-fit border-2 border-black">
          <Image src={coming_soon} alt="TalkWithTito placeholder" className="game-background"/>
          {
            isLoading ?
            <Image src={tito_speak} alt="TalkWithTito placeholder" className="tito-overlay"/>
            :
            <Image src={happyTito} alt="Tito is ready" className="absolute w-[35%] top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2"/>
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
      </div>
    );
}