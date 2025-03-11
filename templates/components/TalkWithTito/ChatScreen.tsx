/* Imports */
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "@/public/static/css/talkwithtito.css";
import {fetchModuleTerms} from "@/services/TitoService";
import { useUser } from "@/hooks/useAuth";

/* Titos :D */
import happyTito from "@/public/static/images/ConversAItionELLE/happyTito.png";
import neutralTito from "@/public/static/images/ConversAItionELLE/tito.png"
import confusedTito from "@/public/static/images/ConversAItionELLE/confusedTito.png";
import tiredTito from "@/public/static/images/ConversAItionELLE/tiredTito.png";
import respondingTito from "@/public/static/images/ConversAItionELLE/respondingTito.png";

/* Other assets */
import background from "@/public/static/images/ConversAItionELLE/Graident Background.png";
import palmTree from "@/public/static/images/ConversAItionELLE/Palm Tree.png";
import sendMessage from "@/public/static/images/ConversAItionELLE/send.png";
import VocabList from "./VocabList";


interface propsInterface {
    moduleID: number;
}

function handleSendMessageClick() {

}

export default function ChatScreen(props: propsInterface) {

    const { user, loading: userLoading } = useUser();

    interface Term {
        termID: number;
        questionFront: string;
        questionBack: string;
    }
    const [terms, setTerms] = useState<Term[]>();
    const [usedTerms, setUsedTerms] = useState<boolean[]>();

    // Called once when component mounts
    // Used to initialize terms
    useEffect(() => {
        if(!userLoading && user) {
            const loadTerms = async () => {
                const newTerms = await fetchModuleTerms(user?.jwt, props.moduleID);
                setTerms(newTerms);
            }
            loadTerms();
        }
    }, [user, userLoading, props.moduleID]);

    //Temporary - assigns usedTerms randomly for visual testing
    useEffect(() => {
        if(terms) {
            setUsedTerms(terms.map((term, index) => (index % 2 == 0 ? true : false)))
        }
    }, [terms])
    

    return(
        <div className="w-full h-full"> {/*Outer container div*/}

            <Image src={background} className="w-full absolute top-0 left-0" alt="Background"/>
            <Image src={palmTree} className="absolute right-0 bottom-0 z-1 w-[33.9%] aspect-[268/516]" alt="Decorative palm tree" />

            {/*Vocabulary list div*/}
            <VocabList words={terms?.map(term => (term.questionFront))} used={usedTerms}/>

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