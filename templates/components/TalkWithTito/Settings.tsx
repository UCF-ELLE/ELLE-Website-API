// CLEANED UP:
// - Removed unused commented-out imports (muteIcon, volumeIcon, infoIcon)
// - Removed outdated commented-out interface fields (onSetTtsMuted, ttsMuted) - feature no longer exists
// - Removed outdated commented-out props destructuring line (duplicate with old TTS fields)
// - Removed dead `handleTtsMute` function - referenced onSetTtsMuted/ttsMuted which are not in scope
//   (not destructured from props) and the function was never called anywhere in this file
// - Removed commented-out debug useEffect (was just console.logging titoMusicChoice)
import React, {useEffect, useState} from 'react';
import Image from "next/image";
import settingsBackground from "@/public/static/images/ConversAItionELLE/SettingsBackground.png";

// Song List
const songList = [
  { name: "Ambient Jungle", path: "/elle/TitoAudios/ambient-jungle.mp3" },
  { name: "Jungle Party", path: "/elle/TitoAudios/jungle-party.mp3" },
  { name: "Happy Rock", path: "/elle/TitoAudios/happy-rock.mp3" },
  { name: "Energetic Rock", path: "/elle/TitoAudios/energetic-rock.mp3" },
  { name: "Pop", path: "/elle/TitoAudios/pop-summer.mp3" },
  { name: "Techno", path: "/elle/TitoAudios/techno.mp3" },
  { name: "Hip Hop", path: "/elle/TitoAudios/hiphop.mp3" },
  { name: "R&B", path: "/elle/TitoAudios/rnb-beats.mp3" },
  { name: "Smooth Jazz", path: "/elle/TitoAudios/jazz-smooth.mp3" },
  { name: "Lofi", path: "/elle/TitoAudios/lofi-groovy.mp3" }
];


interface Song {
  name: string;
  path: string;
}

interface propsInterface {
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

  useEffect (() => {
    setPlaylist(parentPlaylist)
  }, [parentPlaylist])

  useEffect(() => {
    setChatFont(parentFont);
  }, [parentFont]);



  return (
    <div className="absolute inset-0 bg-[#35353580] z-50 flex items-center justify-center p-3 md:p-6">
      <div className="relative w-[92%] max-w-[760px] max-h-[85%] z-50 flex flex-col overflow-hidden rounded-lg">
        <Image
          src={settingsBackground}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Settings background"
        />

        <button
          className="absolute top-2 left-4 z-50 text-xl text-white font-semibold hover:scale-110 transition"
          onClick={handleClose}
        >
          x
        </button>

        <div className="relative z-10 w-full h-full max-h-[85vh] overflow-y-auto flex flex-col items-center text-white px-4 py-3 md:px-8 md:py-4 inter-font">
          <div className="select-none bg-[#997c54] text-xl md:text-3xl p-2 px-4 mb-3 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover">
            Settings
          </div>

          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex flex-col md:flex-row md:justify-center md:items-start gap-3 md:gap-10">
              <div className="select-none text-2xl md:text-3xl irish-grover">
                Music:
              </div>

              <div className="w-full md:w-fit">
                <div className="text-lg md:text-xl mb-2 text-center md:text-left">
                  Song List
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 max-h-[12em] overflow-y-auto">
                  {/* Songs container */}
                  {songList.map((song, index) => (
                    <div key={index} className="flex flex-nowrap">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={playlist.some((s) => s.path === song.path)}
                        onChange={() => togglePlaylist(song)}
                      />
                      <div>{song.name}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row w-full items-center mt-3 justify-center gap-3 text-lg">
                  <div>
                    <input type="checkbox" className="mr-1" onChange={() => handleShuffle()} />
                    Shuffle All
                  </div>

                  <div>
                    <input type="checkbox" className="mr-1" checked={titoMusicChoice} onChange={() => handleAIChoice()} />
                    AI Choice
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex justify-center">
              <div className="select-none w-full max-w-[520px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="text-xl md:text-3xl font-semibold irish-grover">
                  Chat Font Size:
                </div>

                <select
                  className="bg-[#EEEEEE] text-[#2D3648] p-2 rounded-md w-full sm:w-64"
                  value={chatFont}
                  onChange={handleFont}
                >
                  <option value="small" className="text-sm">Small</option>
                  <option value="medium" className="text-base">Medium</option>
                  <option value="large" className="text-lg">Large</option>
                  <option value="xl" className="text-xl">XL</option>
                </select>

                <button
                  onClick={handleApplyClick}
                  className="font-semibold select-none bg-[#997c54] text-xl md:text-3xl p-2 px-4 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}