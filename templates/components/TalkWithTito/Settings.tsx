import React, {useEffect, useState} from 'react';
import Image from "next/image";
import settingsBackground from "@/public/static/images/ConversAItionELLE/SettingsBackground.png";
// import infoIcon from "@/public/static/images/ConversAItionELLE/info.png"

// Song List
const songList = [ 
  { name: "Ambient Jungle", path: "/elle/TitoAudios/ambient-jungle.mp3" },
  { name: "Jungle Party", path: "/elle/TitoAudios/jungle-party.mp3" },
  { name: "Happy Rock", path: "/elle/TitoAudios/happy-rock.mp3" },
  { name: "Energetic Rock", path: "/elle/TitoAudios/energetic-rock.mp3" },
  { name: "Pop", path: "/elle/TitoAudios/pop-summer.mp3" },
  { name: "Techno", path: "/elle/TitoAudios/techno.mp3" },
  { name: "Hip Hop", path: "/elle/TitoAudios/hiphop.mp3" },
  { name: "R&B", path: "/elle/TitoAudios/rnb-beats.mp3"},
  { name: "Smooth Jazz", path: "/elle/TitoAudios/jazz-smooth.mp3" },
  { name: "Lofi", path: "/elle/TitoAudios/lofi-groovy.mp3" }
];


interface Song {
  name: string;
  path: string;
}

interface propsInterface{
  onSetPlaylist: (song: Song[]) => void;
  apply: () => void;
  onSetFont: (chatFont:string) => void;
  onSetAIChoice: (AIChoice:boolean) => void;
  titoMusicChoice: boolean;
  parentPlaylist: Song[];
  parentFont: string;
}

// Fisher-Yates shuffle function
function shuffleArray<T>(playlist: T[]): T[] {
  const shuffled_playlist = [...playlist];
  for (let i = shuffled_playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled_playlist[i], shuffled_playlist[j]] = [shuffled_playlist[j], shuffled_playlist[i]];
  }
  return shuffled_playlist;
}

export default function Settings(props: propsInterface) {
  const {apply, onSetPlaylist, onSetFont, onSetAIChoice, parentPlaylist, parentFont, titoMusicChoice} = props;

  const [playlist, setPlaylist] = useState<Song[]>([])
  const [chatFont, setChatFont] = useState<string>("medium")
  
  const handleApplyClick = () => {
    onSetPlaylist(playlist);
    onSetFont(chatFont);
  }

  const togglePlaylist = (song: Song) => {
      setPlaylist((prev) => {
        const isAlreadySelected = prev.some((s) => s.path === song.path);
        // Remove if already selected, Add of not selected
        return isAlreadySelected
          ? prev.filter((s) => s.path !== song.path) 
          : [...prev, song];
      });
  }

  const handleShuffle = () => {
    setPlaylist(shuffleArray(songList))
  }


  const handleClose = () => {
    apply();
  }

  const handleFont = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFont = event.target.value;
    setChatFont(newFont);
  };

  const handleAIChoice = () => {
    onSetAIChoice(!titoMusicChoice);
    
  }

  useEffect (() => {
    setPlaylist(parentPlaylist)
  },[parentPlaylist])

  useEffect(() => {
    setChatFont(parentFont);
  }, [parentFont]);

  // useEffect(() => {
  //   console.log(titoMusicChoice)
  // }, [titoMusicChoice]);



  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#35353580] z-50">
      <div className="absolute top-[50%] left-[50%] w-[65%] h-[75%] -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col">
        <Image
          src={settingsBackground}
          className="absolute top-0 left-0 w-full h-full"
          alt="Settings background"
        />
        <button className="absolute top-2 left-4 z-50 text-xl text-white font-semibold" onClick={handleClose}>x</button>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-full h-full flex flex-col items-center text-white text-[1vw] pb-4 inter-font">
          <div className="select-none bg-[#997c54] text-1xl md:text-3xl p-2 px-4 my-4 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover">
            Settings
          </div>
          <div className="w-full flex flex-wrap justify-center">
            <div className="select-none text-[2vw] ml-8 w-fit irish-grover">
              Music:
            </div>
            <div className="p-1 ml-16 md:ml-32 w-fit">
              <div className="text-lg">Song List</div>
              <div className="grid grid-cols-2 gap-x-4 md:gap-x-10 gap-y-1 max-h-[10em]">{/* Songs container */}
                {songList.map((song, index) => (
                  <div key={index} className="flex flex-nowrap">
                  <input 
                    type="checkbox" 
                    className="mr-1" 
                    checked={playlist.some((s) => s.path === song.path)} 
                    onChange={()=>togglePlaylist(song)}
                    />
                  <div className="w-[5em] whitespace-nowrap">{song.name}</div>
                </div>
                  ))}
                          
              </div>
              <div className="flex flex-nowrap w-full items-center mt-2 justify-between text-lg ">
                <div className="mx-4">
                  <input type="checkbox" className="mr-1" onChange={()=>handleShuffle()} />
                  Shuffle All
                </div>
                <div className="mx-4">
                  <input type="checkbox" className="mr-1" checked={titoMusicChoice} onChange={()=>handleAIChoice()}/>
                  AI Choice
                </div>
              </div>
            </div>
          
            <div className="w-full flex mt-4">
              <div className="select-none p-2 ml-8 w-fit flex flex-nowrap">
                <div className="text-xl md:text-3xl font-semibold mr-4 irish-grover">Chat Font Size:</div>
                <select className="bg-[#EEEEEE] text-[#2D3648] p-2 rounded-md w-64" value={chatFont} onChange={handleFont}>
                  <option value="small" className="text-sm">Small</option>
                  <option value="medium" className="text-base">Medium</option>
                  <option value="large" className="text-lg">Large</option>
                  <option value="xl" className="text-xl">XL</option>
              </select>
              </div>
            </div>
          </div>
          <button onClick={handleApplyClick} className="font-semibold select-none bg-[#997c54] text-1xl md:text-3xl p-2 px-4 mt-6 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
