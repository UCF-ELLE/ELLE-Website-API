import React, {useState} from 'react';
import Image from "next/image";
import settingsBackground from "@/public/static/images/ConversAItionELLE/SettingsBackground.png";
import infoIcon from "@/public/static/images/ConversAItionELLE/info.png"

// Song List
const songList = [ 
  { name: "Ambient Jungle", path: "/elle/TitoAudios/ambient-jungle.mp3" },
  { name: "Jungle Party", path: "/elle/TitoAudios/jungle-party.mp3" },
  { name: "Happy Rock", path: "/elle/TitoAudios/happy-rock.mp3" },
  { name: "Energetic Rock", path: "/elle/TitoAudios/energetic-rock.mp3" },
  { name: "Pop", path: "/elle/TitoAudios/pop-summer.mp3" },
  { name: "Techno", path: "/elle/TitoAudios/techno.mp3" },
  { name: "HipHop", path: "/elle/TitoAudios/hiphop.mp3" },
  { name: "R&B", path: "/elle/TitoAudios/rnb-beats.mp3"},
  { name: "Smooth Jazz", path: "/elle/TitoAudios/jazz-smooth.mp3" },
  { name: "Lofi", path: "/elle/TitoAudios/lofi-groovy.mp3" }
];


interface Song {
  name: string;
  path: string;
}

interface propsInterface{
  volume: number;
  onSetPlaylist: (song: Song[]) => void;
  apply: () => void;
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
  const {volume, onSetPlaylist} = props;

  const [playlist, setPlaylist] = useState<Song[]>([])
  
  const handleApplyClick = () => {
    onSetPlaylist(playlist);
  }

  const addToPlaylist = (song: Song) => {
    if (!playlist.some((s) => s.path === song.path)) {
      setPlaylist((prev) => [...prev, song]);
    }
  }

  const handleShuffle = () => {
    setPlaylist(shuffleArray(songList))
  }
  

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#35353580] z-50">
      <div className="absolute top-[50%] left-[50%] w-[65%] h-[75%] -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col">
        <Image
          src={settingsBackground}
          className="absolute top-0 left-0 w-full h-full"
          alt="Settings background"
        />
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
                    {/* Add preview song code using checked */}
                  <input type="checkbox" className="mr-1" onChange={()=>addToPlaylist(song)}/>
                  <div className="w-[5em] whitespace-nowrap">{song.name}</div>
                  {/* <Image src={infoIcon} alt="Info" className="gap-10"/> */}
                </div>
                  ))}
                          
              </div>
              <div className="flex flex-nowrap w-full items-center mt-2 justify-between text-lg ">
                <div className="mx-4">
                  <input type="checkbox" className="mr-1" onChange={()=>handleShuffle()} />
                  Shuffle All
                </div>
                <div className="mx-4">
                  <input type="checkbox" className="mr-1" />
                  AI Choice
                </div>
              </div>
            </div>
          
            <div className="w-full flex mt-4">
              <div className="select-none p-2 ml-8 w-fit flex flex-nowrap">
                <div className="text-xl md:text-3xl font-semibold mr-4 irish-grover">Chat Font Size:</div>
                <select className="bg-[#EEEEEE] text-[#2D3648] p-2 rounded-md w-64">
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
