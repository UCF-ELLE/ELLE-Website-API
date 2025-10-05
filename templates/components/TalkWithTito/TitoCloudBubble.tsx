import { useEffect, useState } from "react";
import Image from "next/image";
import cloud from "@/public/static/images/ConversAItionELLE/vocab cloud.png"; // reuse the same asset

interface TitoCloudBubbleProps {
  message: string;
  trigger: any;
}

export default function TitoCloudBubble({ message, trigger }: TitoCloudBubbleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div
      className={`absolute bottom-[90%] mb-3 left-[10%] flex flex-col items-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Cloud background image */}
      <div className="relative w-[350px] h-[175px]">
        <Image src={cloud} className="w-full h-full" alt="Tito Memory" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-2 max-w-[99%]">
          <p className="text-black text-[16px] font-semibold whitespace-pre-line">{message}</p>
        </div>
      </div>

      {/* Tail */}
      {/* Tail from Tito to cloud */}
      <div className="absolute -bottom-8 -left-10 flex flex-col items-center">
        <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full mb-2 translate-x-2"></div>
        <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded-full mb-2 translate-x--6"></div>
        <div className="w-2 h-2 bg-white border-2 border-gray-300 rounded-full translate-x--10"></div>
      </div>

    </div>

  );
}
