import { useEffect, useState } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    delay: number;
    duration: number;
}

const COLORS = ["#FFD700", "#FF6347", "#FF4500", "#FFA500", "#FFD700", "#FF69B4", "#00FF7F", "#00BFFF"];

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function generateBurst(originX: number, originY: number, baseId: number, count: number): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + randomBetween(-0.15, 0.15);
        const distance = randomBetween(80, 180);
        particles.push({
            id: baseId + i,
            x: originX + Math.cos(angle) * distance,
            y: originY + Math.sin(angle) * distance,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: randomBetween(4, 9),
            delay: randomBetween(0, 0.15),
            duration: randomBetween(0.8, 1.3),
        });
    }
    return particles;
}

export default function Fireworks() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        const all: Particle[] = [];
        for (let burst = 0; burst < 4; burst++) {
            const originX = cx + randomBetween(-80, 80);
            const originY = cy + randomBetween(-60, 60);
            all.push(...generateBurst(originX, originY, burst * 100, 16));
        }
        setParticles(all);
    }, []);

    if (particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="firework-particle"
                    style={{
                        left: `50%`,
                        top: `50%`,
                        "--dx": `${p.x - window.innerWidth / 2}px`,
                        "--dy": `${p.y - window.innerHeight / 2}px`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: "50%",
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}
