import React from 'react';

interface IconProps {
    name: string;
    className?: string;
}

export default function Icon({ name, className = '' }: IconProps) {
    const paths: Record<string, React.ReactNode> = {
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </>
        ),
        globe: (
            <>
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="4" ry="9" />
                <path d="M3 12h18" />
            </>
        ),
        plus: <path d="M12 5v14M5 12h14" />,
        arrow: <path d="m9 5 7 7-7 7" />,
        check: <path d="m5 12 4 4L19 6" />,
        link: (
            <path
                d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"
                transform="translate(0 1) scale(.9)"
            />
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        shield: (
            <>
                <path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6z" />
                <path d="m8 12 3 3 5-6" />
            </>
        ),
        spark: (
            <>
                <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
                <path d="M20 2v4M18 4h4" />
            </>
        ),
        settings: (
            <>
                <circle cx="12" cy="12" r="4" />
                <path d="m9 3-1 3-3 1-2 3 2 2-1 4 3 1 2 4h4l1-3 4-1 3-3-2-3 1-3-4-1-2-4z" />
            </>
        ),
        help: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 8a3 3 0 0 1 6 0c0 3-3 2-3 5M12 16v1" />
            </>
        ),
        external: (
            <>
                <path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6" />
            </>
        ),
        search: (
            <>
                <circle cx="10" cy="10" r="6" />
                <path d="m15 15 5 5" />
            </>
        ),
        bell: (
            <>
                <path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 21h4" />
            </>
        ),
        file: (
            <>
                <path d="M14 3H5v18h14V8z" />
                <path d="M14 3v6h5M8 13h8M8 17h6" />
            </>
        ),
        upload: (
            <>
                <path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" />
            </>
        ),
        monitor: (
            <>
                <rect x="3" y="3" width="18" height="13" rx="2" />
                <path d="M12 16v5M7 21h10" />
            </>
        ),
        phone: <rect x="6" y="2" width="12" height="20" rx="2" />,
        eye: (
            <>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        more: (
            <>
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
            </>
        ),
    };

    return (
        <svg
            className={`h-5 w-5 shrink-0 ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name] || paths.grid}
        </svg>
    );
}
