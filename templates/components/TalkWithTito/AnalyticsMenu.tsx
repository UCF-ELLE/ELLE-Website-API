// CLEANED UP:
// - Removed unused import `exportAudio` (not used in this file; still exported from TitoService for other files)
// - Removed unused destructured var `loading: userLoading` from useUser()
// - Fixed JSX indentation (block from isFreeTalk checks through closing tags was mis-nested)
// - Minor whitespace cleanup: `if(` -> `if (`, trimmed trailing spaces
import { exportChat, exportModuleAudio } from "@/services/TitoService";
import { useUser } from "@/hooks/useAuth";

interface propsInterface {
    timeSpent: string;
    termScore: string;
    averageScore: number;
    chatbotId?: number;
    isFreeTalk: boolean;
    moduleId?: number;
    classId?: number;
    onClose: () => void;
}

export default function AnalyticsMenu(props: propsInterface) {
    const { user } = useUser();

    async function handleExportClick() {
        if (!user || !props.chatbotId) return;
        const exportChatResult = await exportChat(user.jwt, user.userID, props.chatbotId);
        if (exportChatResult !== ":)") {
            console.log("Failed to export chat");
        }
    }

    async function handleExportAudioClick() {
        if (!user || !props.moduleId) return;
        const classId = props.classId || 1; // Default to class 1 if not provided

        try {
            // Export all audio from this module (not just current session)
            const exportAudioResult = await exportModuleAudio(user.jwt, props.moduleId, classId);
            if (exportAudioResult === ":)") {
                console.log("Audio export successful!");
            } else {
                console.log("Failed to export audio - this may be because no voice messages have been recorded yet");
            }
        } catch (error) {
            // Catch any unexpected errors to prevent error boundary triggers
            console.error("Unexpected error during audio export:", error);
        }
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="relative w-[85%] max-w-[420px] bg-white border-2 border-black p-5 rounded-lg shadow-lg flex flex-col items-center">

                <button
                    onClick={props.onClose}
                    className="absolute top-2 left-3 text-xl font-bold hover:scale-110 transition"
                >
                    x
                </button>

                <div className="text-2xl inter-font font-bold mb-4">
                    Chat Analytics
                </div>

                <div className="w-full mb-2">
                    <div className="inline-block font-bold">Time Spent:</div> {props.timeSpent}
                </div>

                {!props.isFreeTalk && (
                    <div className="w-full mb-2">
                        <div className="inline-block font-bold">Terms Used:</div> {props.termScore}
                    </div>
                )}

                {!props.isFreeTalk && (
                    <div className="w-full mb-2">
                        <div className="inline-block font-bold">Average Score:</div> {props.averageScore.toFixed(2)}
                    </div>
                )}

                <div className="w-full mb-2">
                    <div className="inline-block font-bold mr-1">Export Chat:</div>
                    {(user && props.chatbotId) ? (
                        <button className="border border-black rounded px-2 py-1 bg-gray-300 hover:bg-gray-400" onClick={handleExportClick}>
                            Download CSV
                        </button>
                    ) : (
                        <>Loading...</>
                    )}
                </div>

                <div className="w-full mb-2">
                    <div className="inline-block font-bold mr-1">Export Audio:</div>
                    {(user && props.moduleId) ? (
                        <button className="border border-black rounded px-1 bg-blue-300 hover:bg-blue-400" onClick={handleExportAudioClick}>
                            Download MP3
                        </button>
                    ) : (
                        <>Loading...</>
                    )}
                </div>
            </div>
        </div>
    );
}