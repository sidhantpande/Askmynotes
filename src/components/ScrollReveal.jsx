"use client";

import { useEffect, useRef } from "react";

export default function ScrollReveal({ children, type = "reveal", delay = 0 }) {
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const current = domRef.current;
        if (current) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={type}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
