import { useEffect, useState } from "react";

export const ChessClock = ({
    time,
    isActive,
    color,
}: {
    time: number;
    isActive: boolean;
    color: "white" | "black";
}) => {
    const [displayTime, setDisplayTime] = useState(time);

    // Sync with prop when it changes (from server)
    useEffect(() => {
        setDisplayTime(time);
    }, [time]);

    // Tick locally when active
    useEffect(() => {
        if (!isActive || displayTime <= 0) return;

        const interval = setInterval(() => {
            setDisplayTime((prev) => Math.max(0, prev - 100)); // Tick every 100ms for smoothness
        }, 100);

        return () => clearInterval(interval);
    }, [isActive, displayTime]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Show tenths of a second if under 10 seconds
        if (ms > 0 && ms < 10000) {
            const tenths = Math.floor((ms % 1000) / 100);
            return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${tenths}`;
        }

        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const isLowTime = displayTime > 0 && displayTime <= 10000;
    const isZero = displayTime <= 0;

    return (
        <div
            className={`
        px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-mono text-sm sm:text-xl font-bold transition-all duration-300 flex items-center border shadow-[0_4px_12px_rgba(0,0,0,0.10)] origin-right
        ${isActive ? "bg-[#1D1E1C] border-[#2B2D29] scale-105" : "bg-[#171817] border-[#2B2D29] opacity-80"}
        ${isLowTime && isActive ? "text-[#D7B68A] bg-[#241F1B] border-[#493E34]" : ""}
        ${isZero ? "text-[#C9B18A] bg-[#211D1A] border-[#473B32]" : ""}
        ${!isLowTime && !isZero ? (isActive ? "text-[#E8E5DC]" : "text-[#A6A59E]") : ""}
      `}
        >
            <span className={`mr-1 sm:mr-2 text-[10px] sm:text-sm uppercase tracking-widest font-black ${isActive ? "text-[#A6A59E] opacity-100" : "text-[#777871] opacity-70"}`}>{color}</span>
            {formatTime(displayTime)}
        </div>
    );
};
