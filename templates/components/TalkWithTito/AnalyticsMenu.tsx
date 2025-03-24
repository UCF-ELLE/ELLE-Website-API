interface propsInterface {
    timeSpent?: string;
    termsUsed?: string;
    averageScore?: number;
}

export default function AnalyticsMenu(props: propsInterface) {
    return(
        <div className="h-fit w-[17em] absolute top-0 left-[-18em] bg-white border-2 border-black p-2 rounded flex flex-col items-center">
            <div className="text-xl inter-font">
                Chat Analytics
            </div>
            <div className="w-full">
                <div className="inline-block font-bold">Time Spent:</div> {props.timeSpent ? props.timeSpent : "00d:00h:00m:00s"}
            </div>
            <div className="w-full">
                <div className="inline-block font-bold">Terms Used:</div> {props.termsUsed ? props.termsUsed : "000/000"}
            </div>
            <div className="w-full">
                <div className="inline-block font-bold">Average Score:</div> {props.averageScore ? props.averageScore : "0.00"}
            </div>
        </div>
    )
}