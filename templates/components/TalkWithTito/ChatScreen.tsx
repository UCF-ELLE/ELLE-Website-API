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
    const [terms, setTerms] = useState<Term[]>(
        /*[
            { termID: 0, questionFront: "Rojo", questionBack: "Red" },
            { termID: 1, questionFront: "Azul", questionBack: "Blue" },
            { termID: 2, questionFront: "Amarillo", questionBack: "Yellow" },
            { termID: 3, questionFront: "Verde", questionBack: "Green" },
            { termID: 4, questionFront: "Naranja", questionBack: "Orange" },
            { termID: 5, questionFront: "Morado", questionBack: "Purple" },
            { termID: 6, questionFront: "Negro", questionBack: "Black" },
            { termID: 7, questionFront: "Blanco", questionBack: "White" },
            { termID: 8, questionFront: "Gris", questionBack: "Gray" },
            { termID: 9, questionFront: "Rosa", questionBack: "Pink" },
            { termID: 10, questionFront: "Marrón", questionBack: "Brown" },
            { termID: 11, questionFront: "Violeta", questionBack: "Violet" },
            { termID: 12, questionFront: "Cielo", questionBack: "Sky" },
            { termID: 13, questionFront: "Mar", questionBack: "Sea" },
            { termID: 14, questionFront: "Sol", questionBack: "Sun" },
            { termID: 15, questionFront: "Luna", questionBack: "Moon" },
            { termID: 16, questionFront: "Estrella", questionBack: "Star" },
            { termID: 17, questionFront: "Árbol", questionBack: "Tree" },
            { termID: 18, questionFront: "Flor", questionBack: "Flower" },
            { termID: 19, questionFront: "Montaña", questionBack: "Mountain" },
            { termID: 20, questionFront: "Río", questionBack: "River" },
            { termID: 21, questionFront: "Lago", questionBack: "Lake" },
            { termID: 22, questionFront: "Playa", questionBack: "Beach" },
            { termID: 23, questionFront: "Bosque", questionBack: "Forest" },
            { termID: 24, questionFront: "Desierto", questionBack: "Desert" },
            { termID: 25, questionFront: "Ciudad", questionBack: "City" },
            { termID: 26, questionFront: "País", questionBack: "Country" },
            { termID: 27, questionFront: "Calle", questionBack: "Street" },
            { termID: 28, questionFront: "Casa", questionBack: "House" },
            { termID: 29, questionFront: "Habitación", questionBack: "Room" },
            { termID: 30, questionFront: "Puerta", questionBack: "Door" },
            { termID: 31, questionFront: "Ventana", questionBack: "Window" },
            { termID: 32, questionFront: "Techo", questionBack: "Ceiling" },
            { termID: 33, questionFront: "Silla", questionBack: "Chair" },
            { termID: 34, questionFront: "Mesa", questionBack: "Table" },
            { termID: 35, questionFront: "Cama", questionBack: "Bed" },
            { termID: 36, questionFront: "Espejo", questionBack: "Mirror" },
            { termID: 37, questionFront: "Libro", questionBack: "Book" },
            { termID: 38, questionFront: "Cuaderno", questionBack: "Notebook" },
            { termID: 39, questionFront: "Lápiz", questionBack: "Pencil" },
            { termID: 40, questionFront: "Bolígrafo", questionBack: "Pen" }
        ]*/
    );
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
            <VocabList wordsFront={terms?.map(term => (term.questionFront))} wordsBack={terms?.map(term => (term.questionBack))} used={usedTerms}/>

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