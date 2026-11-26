import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icon';
import Thumbnail from '@/Components/Thumbnail';

interface Project {
    id: number;
    name: string;
    city: string;
    kind: string;
}

interface GenerationProps {
    project: Project;
}

export default function Generation({ project }: GenerationProps) {
    const [stage, setStage] = useState(0);

    const stages = [
        'Organizing verified business profile',
        'Selecting responsive layout structure',
        'Structuring grounded service offerings',
        'Embedding verified schedule & contact details',
        'Applying design tokens & typography presets',
        'Preparing live interactive canvas',
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setStage((prev) => {
                if (prev < stages.length - 1) {
                    return prev + 1;
                }
                clearInterval(timer);
                return prev;
            });
        }, 600);

        return () => clearInterval(timer);
    }, []);

    const handleOpenEditor = () => {
        router.post(route('projects.generate-site', project.id));
    };

    const isComplete = stage === stages.length - 1;

    return (
        <AppLayout title="Generating website" breadcrumb="Website synthesis">
            <Head title={`Generating website - ${project.name}`} />

            <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
                <div className="grid items-center gap-10 md:grid-cols-2">
                    {/* Left: Progress Stages */}
                    <div>
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                            <Icon name="spark" className="h-5 w-5" />
                        </div>

                        <div className="mb-2">
                            <span className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                Grounded Synthesis Engine
                            </span>
                        </div>

                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                            {isComplete
                                ? 'Your website layout is ready.'
                                : 'Synthesizing verified business website.'}
                        </h2>

                        <p className="my-3 text-sm leading-6 text-slate-500">
                            Composing sections grounded strictly on your verified facts and confirmed schedule. Zero reviews, awards, or claims will be fabricated.
                        </p>

                        <div className="my-6 space-y-3">
                            {stages.map((s, idx) => {
                                const isPassed = isComplete || idx < stage;
                                const isCurrent = !isComplete && idx === stage;

                                return (
                                    <div
                                        key={s}
                                        className={`flex items-center gap-3 text-xs sm:text-sm transition-colors ${
                                            isPassed
                                                ? 'text-slate-800 font-medium'
                                                : isCurrent
                                                ? 'text-indigo-700 font-semibold'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                                                isPassed
                                                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                                                    : isCurrent
                                                    ? 'bg-indigo-100 text-indigo-700 font-bold animate-pulse'
                                                    : 'bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            {isPassed ? '✓' : isCurrent ? '○' : '·'}
                                        </span>
                                        <span>{s}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleOpenEditor}
                            disabled={!isComplete}
                            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isComplete ? 'Open website editor' : 'Synthesizing…'}
                            <Icon name="arrow" className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Right: Live Preview Banner */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-md">
                        <Thumbnail kind={project.kind || 'general'} name={project.name} large />
                        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                            <span className="text-xs text-slate-500">
                                100% Grounded layout ready for live visual editing
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
