/* Imports */
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";

/* Titos :D */
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png";
import neutralTito from "@/public/static/images/ConversAItionELLE/tito.png"
import confusedTito from "@/public/static/images/ConversAItionELLE/confusedTito.png";
import tiredTito from "@/public/static/images/ConversAItionELLE/tiredTito.png";
import respondingTito from "@/public/static/images/ConversAItionELLE/respondingTito.png";

/* Other assets */
import background from "@/public/static/images/ConversAItionELLE/Graident Background.png";
import palmTree from "@/public/static/images/ConversAItionELLE/Palm Tree.png";
import cloud from "@/public/static/images/ConversAItionELLE/vocab cloud.png";
import cloud2 from "@/public/static/images/ConversAItionELLE/cloudWithText.png";
import sendMessage from "@/public/static/images/ConversAItionELLE/send.png";


interface propsInterface {
    moduleID: number;
}

function handleSendMessageClick() {

}

export default function ChatScreen(props: propsInterface) {
    return(
        <div className="w-full h-full"> {/*Outer container div*/}

            <Image src={background} className="w-full absolute top-0 left-0" alt="Background"/>
            <Image src={palmTree} className="absolute right-0 bottom-0 z-1 w-[33.9%] aspect-[268/516]" alt="Decorative palm tree" />

            {/*Vocabulary list div*/}
            <div className="absolute top-1 right-1 w-fit h-fit flex flex-col items-center z-2">
                <Image src={cloud2} className="" alt="Vocabulary List" />
                <div id="vocabList" className="w-[277px] bg-[#A6DAFF] border-[#8ACEFF] border-[5px] rounded p-2 mt-1 flex flex-col items-center justify-center">
                    <div className="break-words line-through select-none">Rojo</div>
                    <div className="break-words select-none">Verde</div>
                    <div className="break-words line-through select-none">Azul</div>
                    <div className="break-words line-through select-none">Amarillo</div>
                    <div className="break-words select-none">Morado</div>
                    <div className="break-words line-through select-none">Rosa</div>
                </div>
            </div>
            

            {/*Sent/recieved messages div*/}
            <div>
                
            </div>

            {/*Chat box div*/}
            <div className="w-full h-[15%] absolute bottom-0 left-0 bg-[#8C7357]
            flex items-center justify-center
            ">
                <div className="w-[70%] min-h-[3em] h-fit max-h-full bg-white rounded mx-3" />
                <Image src={sendMessage} alt="Send message" onClick={handleSendMessageClick}/>
            </div>
        </div>
    )
}