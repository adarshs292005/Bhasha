import { useState, useEffect, useRef } from "react";
export default function useHandTracking() {
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        console.log("Custom hook started");
        setIsLoading(false);
    }, []);
    return{
        isLoading
    };
}