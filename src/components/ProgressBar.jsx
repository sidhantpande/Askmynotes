"use client";

import { useEffect, useState } from "react";

export default function ProgressBar() {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            if (totalScroll > 0) {
                setScrollProgress((currentScroll / totalScroll) * 100);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div
            id="progress-bar"
            style={{ width: `${scrollProgress}%` }}
        />
    );
}
