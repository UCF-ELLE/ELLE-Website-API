import React, {useState} from 'react';
import Image from "next/image";
import settingsBackground from "@/public/static/images/ConversAItionELLE/SettingsBackground.png";
import infoIcon from "@/public/static/images/ConversAItionELLE/info.png"
import ReactHowler from 'react-howler';

interface propsInterface {
  apply: () => void
}

// Song List
const songList = [
  "/elle/TitoAudios/techno.mp3", // Adjust paths for each song if needed
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3",
  "/elle/TitoAudios/techno.mp3"
];

export default function ModuleButton(props: propsInterface) {

  function handleApplyClick() {

    props.apply();
  }
  
  // Music
  
  const [isPlaying, setIsPlaying] = useState<boolean[]>(Array(songList.length).fill(false));

  const toggleMusic = (index: number) => {
    setIsPlaying((prev) =>
      prev.map((state, i) => (i === index ? !state : state))
    );
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#35353580] z-50">
      <div className="absolute top-[50%] left-[50%] w-[60%] h-[70%] -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col">
        <Image
          src={settingsBackground}
          className="absolute top-0 left-0 w-full h-full"
          alt="Settings background"
        />
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center text-white inter-font">
          <div className="select-none bg-[#997c54] text-4xl p-2 px-4 my-8 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover">
            Settings
          </div>
          <div className="w-full flex">
            <div className="select-none text-3xl p-2 ml-8 w-fit irish-grover">
              Music:
            </div>
            <div className="p-2 ml-32 w-fit">
              <div className="text-lg">Song List</div>
              <div className="grid grid-cols-2 gap-x-20 gap-y-1 max-h-[10em]">{/* Songs container */}
                    {songList.map((path, index) => (
                        <div key={index} className="flex flex-nowrap">
                        <input type="checkbox" className="mr-1" checked={isPlaying[index]} onChange={()=>toggleMusic(index)}/>
                        <ReactHowler
                          src={path} // use variable name
                          playing={isPlaying[index]}
                          loop={true} // Optional: set to true if you want the song to repeat
                          volume={0.5} // Adjust volume (0 to 1)
                        />
                        <div className="w-[5em]">Song {index + 1}</div>
                        <Image src={infoIcon} alt="Info"/>
                        </div>
                    ))}
              </div>
              <div className="flex flex-nowrap w-full items-center mt-2 justify-between text-lg ">
                <div className="mx-4">
                  <input type="checkbox" className="mr-1" />
                  Shuffle All
                </div>
                <div className="mx-4">
                  <input type="checkbox" className="mr-1" />
                  AI Choice
                </div>
              </div>
            </div>
          </div>
          <div className="w-full flex mt-4">
            <div className="select-none p-2 ml-8 w-fit flex flex-nowrap">
              <div className="text-3xl font-semibold mr-4 irish-grover">Chat Font Size:</div>
              <select className="bg-[#EEEEEE] text-[#2D3648] p-2 rounded-md w-64">
                <option value="small" className="text-sm">Small</option>
                <option value="medium" className="text-base">Medium</option>
                <option value="large" className="text-lg">Large</option>
                <option value="xl" className="text-xl">XL</option>
            </select>
            </div>
          </div>
          <button className="font-semibold select-none bg-[#997c54] text-4xl p-2 px-4 mt-8 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)] irish-grover" onClick={handleApplyClick}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
