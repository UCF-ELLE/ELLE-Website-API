"use client"

import "@/public/static/css/style.css";
import "@/lib/font-awesome/css/font-awesome.min.css";
import "@/lib/owlcarousel/assets/owl.carousel.min.css";
import "@/lib/ionicons/css/ionicons.min.css";
import {useState, useEffect, useRef} from "react";
import "@/public/static/css/talkwithtito.css";
import coming_soon from "@/public/static/images/ConversAItionELLE/coming_soon.png";
import tito_speak from "@/public/static/images/ConversAItionELLE/tito.png";
import Image from "next/image";

export default function talkwithtito(){
  const titoStatements:string[] = ['Tito is creating a new dish', 'Tito is freshening up', 'Tito is taking a nap']
  const titoStatementsRef = useRef<string[]>(titoStatements)

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
    <div className="header">
    <div className="body">
      <div className="game-container">
        <Image src={coming_soon} alt="TalkWithTito placeholder" className="game-background"/>
        <h2 className="text-overlay">{statement}</h2>
        <h1 className="in-progress-overlay">Coming Soon</h1>
        <Image src={tito_speak} alt="TalkWithTito placeholder" className="tito-overlay"/>
      </div>
        
    </div>
    </div>
    );

}

