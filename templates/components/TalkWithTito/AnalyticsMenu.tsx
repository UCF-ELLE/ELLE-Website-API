import { exportChat } from "@/services/TitoService";
import { useUser } from "@/hooks/useAuth";

interface propsInterface {
    timeSpent: string;
    termScore: string;
    averageScore: number;
    chatbotId?: number;
    isFreeTalk: boolean;
}



export default function AnalyticsMenu(props: propsInterface) {
    const { user, loading: userLoading } = useUser();

    async function handleExportClick() {
        if(!user || !props.chatbotId) return;
        const exportChatResult = await exportChat(user.jwt, user.userID, props.chatbotId);
        if(exportChatResult !== ":)") {
            console.log("Failed to export chat");
        }
    }

    return(
        <div className="h-fit w-[17em] absolute top-0 left-[-18em] bg-white border-2 border-black p-2 rounded flex flex-col items-center">
            <div className="text-xl inter-font">
                Chat Analytics
            </div>
            <div className="w-full">
                <div className="inline-block font-bold">Time Spent:</div> {props.timeSpent}
            </div>
            {!props.isFreeTalk && 
            <div className="w-full">
                <div className="inline-block font-bold">Terms Used:</div> {props.termScore}
            </div>}
            {!props.isFreeTalk && 
            <div className="w-full">
                <div className="inline-block font-bold">Average Score:</div> {props.averageScore.toFixed(2)}
            </div>}
            <div className="w-full">
                <div className="inline-block font-bold mr-1">Export Chat:</div>
                {(user && props.chatbotId) ?
                <button className="border border-black rounded px-1 bg-gray-300 hover:bg-gray-400" onClick={handleExportClick}>Download CSV</button>
                :
                <>Loading...</>
                }
            </div>
        </div>
    )
}