"use client";

interface ToggleSwitchProps {
    isOn: boolean;
    onToggle: (newState: boolean) => void;
    className?: string;
}

export default function ToggleSwitch({
    isOn,
    onToggle,
    className = "",
}: ToggleSwitchProps) {

    const toggle = () => {
        onToggle(!isOn);
    };

    return (
        <div
            onClick={toggle}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${isOn ? "bg-green-500" : "bg-gray-300"} ${className}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${isOn ? "translate-x-6" : ""}`}></div>
        </div>
    );
}

