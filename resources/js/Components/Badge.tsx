import React from 'react';

interface BadgeProps {
    status: string;
}

export default function Badge({ status }: BadgeProps) {
    const isSuccess = status === 'published' || status === 'Published' || status === 'verified' || status === 'Verified';
    const isWarning = status === 'needs_review' || status === 'Needs review';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                isSuccess
                    ? 'bg-emerald-50 text-emerald-700'
                    : isWarning
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    isSuccess ? 'bg-emerald-600' : isWarning ? 'bg-amber-500' : 'bg-slate-500'
                }`}
            />
            {status === 'needs_review' ? 'Needs review' : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
