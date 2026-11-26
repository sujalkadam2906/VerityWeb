import React from 'react';

interface ThumbnailProps {
    kind?: string;
    large?: boolean;
    name?: string;
}

export default function Thumbnail({ kind = 'general', large = false, name }: ThumbnailProps) {
    if (kind === 'cafe') {
        return (
            <div className={`relative overflow-hidden bg-[#f7f4ed] ${large ? 'h-72' : 'h-48'}`}>
                <div className="flex h-8 items-center justify-between px-5 text-[12px] text-[#35513e]">
                    <span className="font-serif font-bold">{name || 'bloom & bean'}</span>
                    <span>Our story · Menu · Visit us</span>
                </div>
                <div className="grid h-full grid-cols-2">
                    <div className="px-5 pt-4">
                        <span className="text-[10px] uppercase tracking-widest text-stone-600">
                            Your daily little ritual
                        </span>
                        <h3 className="mt-1 font-serif text-2xl leading-tight text-[#304a37]">
                            Good coffee.
                            <br />
                            Better company.
                        </h3>
                        <span className="mt-3 inline-block bg-[#35513e] px-2.5 py-1.5 text-[11px] text-white">
                            Find your moment ↗
                        </span>
                    </div>
                    <div className="relative flex items-center justify-center bg-stone-200">
                        <svg
                            role="img"
                            aria-label="Illustrated café landscape"
                            viewBox="0 0 600 400"
                            className="h-full w-full object-cover"
                        >
                            <path fill="#54735e" d="M0 280 160 100l150 180 120-120 170 180v60H0z" />
                            <circle fill="#f4d6a3" cx="440" cy="90" r="45" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    }

    if (kind === 'fitness') {
        return (
            <div
                className={`relative overflow-hidden ${large ? 'h-72' : 'h-48'} bg-[#202723] text-[#e4edbd]`}
            >
                <div className="flex justify-between px-5 py-3 text-xs font-medium">
                    <span>{name || 'URBANFIT®'}</span>
                    <span>About · Services</span>
                </div>
                <div className="relative z-10 px-6 pt-2">
                    <p className="text-[10px] uppercase tracking-widest">
                        Find your stronger self
                    </p>
                    <h3 className="mt-2 text-2xl leading-none font-black italic">
                        YOUR SPACE.
                        <br />
                        YOUR STRONG.
                    </h3>
                </div>
                <div className="absolute -right-6 bottom-0 h-40 w-36 rotate-12 rounded-t-full bg-[#667759]" />
            </div>
        );
    }

    return (
        <div
            className={`relative overflow-hidden ${large ? 'h-72' : 'h-48'} bg-[#f8fafc] text-slate-800 border-b border-slate-200`}
        >
            <div className="flex justify-between px-5 py-3 text-xs font-semibold text-slate-700">
                <span className="truncate max-w-[200px]">{name || 'VerityWeb Business'}</span>
                <span>Story · Services · Contact</span>
            </div>
            <div className="relative z-10 px-6 pt-3">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-indigo-600">
                    Verified Business Website
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-sans">
                    Authentic & Grounded
                    <br />
                    Professional Presence
                </h3>
            </div>
            <div className="absolute -right-6 bottom-0 h-40 w-36 rotate-12 rounded-t-full bg-indigo-100/70" />
        </div>
    );
}
