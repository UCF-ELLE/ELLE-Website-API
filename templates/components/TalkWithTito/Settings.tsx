import Image from "next/image";
import settingsBackground from "@/public/static/images/ConversAItionELLE/SettingsBackground.png";
import infoIcon from "@/public/static/images/ConversAItionELLE/info.png"

interface propsInterface {
  apply: () => void
}

export default function ModuleButton(props: propsInterface) {

  function handleApplyClick() {
    props.apply();
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#35353580] z-1">
      <div className="absolute top-[50%] left-[50%] w-[60%] h-[70%] -translate-x-1/2 -translate-y-1/2 z-1 flex flex-col">
        <Image
          src={settingsBackground}
          className="absolute top-0 left-0 w-full h-full"
          alt="Settings background"
        />
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center text-white irish-grover">
          <div className="font-semibold select-none bg-[#997c54] text-4xl p-2 my-8 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)]">
            Settings
          </div>
          <div className="w-full flex">
            <div className="font-semibold select-none text-3xl p-2 ml-8 w-fit">
              Music:
            </div>
            <div className="p-2 ml-32 w-fit">
              <div className="font-semibold text-lg">Song List</div>
              <div className="grid grid-cols-2 gap-x-20 gap-y-1 max-h-[10em]">{/* Songs container */}
                    {[...Array(10)].map((_, index) => (
                        <div key={index} className="flex flex-nowrap">
                        <input type="checkbox" className="mr-1"/>
                        <div className="w-[5em]">Song {index + 1}</div>
                        <Image src={infoIcon} alt="Info"/>
                        </div>
                    ))}
              </div>
              <div className="flex flex-nowrap w-full items-center mt-2 justify-between text-lg font-semibold">
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
              <div className="text-3xl font-semibold mr-4">Chat Font Size:</div>
              <select className="bg-[#EEEEEE] text-[#2D3648] p-2 rounded-md w-64">
                <option value="small" className="text-sm">Small</option>
                <option value="medium" className="text-base">Medium</option>
                <option value="large" className="text-lg">Large</option>
                <option value="xl" className="text-xl">XL</option>
            </select>
            </div>
          </div>
          <button className="font-semibold select-none bg-[#997c54] text-4xl p-2 mt-8 rounded shadow-[0px_4px_4px_rgba(0,0,0,0.3)]" onClick={handleApplyClick}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
