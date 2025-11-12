import { exportChat, exportAudio, exportModuleAudio } from "@/services/TitoService";
import { useUser } from "@/hooks/useAuth";

interface propsInterface {
    timeSpent: string;
    termScore: string;
    averageScore: number;
    chatbotId?: number;
    isFreeTalk: boolean;
    moduleId?: number;
    classId?: number;
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

    async function handleExportAudioClick() {
        if(!user || !props.moduleId) return;
        const classId = props.classId || 1; // Default to class 1 if not provided
        
        try {
            // Export all audio from this module (not just current session)
            const exportAudioResult = await exportModuleAudio(user.jwt, props.moduleId, classId);
            if(exportAudioResult === ":)") {
                console.log("Audio export successful!");
            } else {
                console.log("Failed to export audio - this may be because no voice messages have been recorded yet");
            }
        } catch (error) {
            // Catch any unexpected errors to prevent error boundary triggers
            console.error("Unexpected error during audio export:", error);
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
            <div className="w-full">
                <div className="inline-block font-bold mr-1">Export Audio:</div>
                {(user && props.moduleId) ?
                <button className="border border-black rounded px-1 bg-blue-300 hover:bg-blue-400" onClick={handleExportAudioClick}>Download MP3</button>
                :
                <>Loading...</>
                }
            </div>
        </div>
    )
}