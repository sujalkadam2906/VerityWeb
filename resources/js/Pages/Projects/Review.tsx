import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icon';
import Badge from '@/Components/Badge';

interface Project {
    id: number;
    name: string;
    city: string;
    category: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    links: string[] | null;
    status: string;
}

interface ReviewProps {
    project: Project;
}

export default function Review({ project }: ReviewProps) {
    const [tab, setTab] = useState('All facts');
    const [selectedHours, setSelectedHours] = useState('Monday – Friday: 9:00 AM – 5:00 PM');
    const [customHours, setCustomHours] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [selectedSourceDetail, setSelectedSourceDetail] = useState<string | null>(null);

    // Build verified facts strictly from project inputs
    const baseFacts = [
        { label: 'Business name', value: project.name, source: 'Owner Intake Profile', verified: true },
        { label: 'Business category', value: project.category || 'Local business', source: 'Owner Intake Profile', verified: true },
        { label: 'Location & City', value: project.address ? `${project.address}, ${project.city}` : project.city, source: project.address ? 'Street Address & City Intake' : 'City Intake', verified: true },
        { label: 'Contact phone', value: project.phone || 'Not provided (Will not invent numbers)', source: project.phone ? 'Phone Intake' : 'Awaiting input', verified: Boolean(project.phone) },
        { label: 'Business overview', value: project.description || 'Not provided (Will not invent claims)', source: project.description ? 'Description Intake' : 'Awaiting input', verified: Boolean(project.description) },
    ];

    const linkFacts = (project.links || []).filter(Boolean).map((link, idx) => ({
        label: `Online link ${idx + 1}`,
        value: link,
        source: 'Submitted Online Presence',
        verified: true,
    }));

    const facts = [...baseFacts, ...linkFacts];

    // Real grounded sources
    const sources = [
        {
            name: 'Direct Business Intake',
            type: 'Owner submission',
            detail: `${project.name} · Verified inputs`,
            status: 'Verified',
            kind: 'web',
        },
        ...(project.links || []).filter(Boolean).map((link) => ({
            name: link,
            type: 'Online Presence Link',
            detail: 'Staged for cross-referencing',
            status: 'Staged',
            kind: 'web',
        })),
    ];

    const handleConfirmSchedule = () => {
        setIsConfirmed(true);
    };

    const handleProceedToGeneration = () => {
        const finalHours = selectedHours === 'custom' ? customHours : selectedHours;
        router.post(route('projects.confirm-facts', project.id), {
            phone: project.phone,
            operating_hours: finalHours || 'Monday – Friday: 9:00 AM – 5:00 PM',
        });
    };

    const verifiedCount = facts.filter((f) => f.verified).length + (isConfirmed ? 1 : 0);
    const totalFacts = facts.length + 1;

    return (
        <AppLayout title="Review information" breadcrumb="Fact verification">
            <Head title={`Fact Verification - ${project.name}`} />

            {/* Top Readiness Banner */}
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-7">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{project.name}</span>
                        <Badge status={isConfirmed ? 'Verified' : 'Needs review'} />
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        Review your business facts
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                        Every fact is proven by an original source or your direct input. Confirm your operating schedule before synthesizing your website.
                    </p>
                </div>

                <button
                    onClick={handleProceedToGeneration}
                    disabled={!isConfirmed}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Generate my website
                    <Icon name="arrow" className="h-4 w-4" />
                </button>
            </div>

            {/* Stats Tally Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 text-sm">
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
                    <span>
                        <strong className="font-semibold text-slate-900">{totalFacts}</strong>{' '}
                        <span className="text-slate-500">facts identified</span>
                    </span>
                    <span>
                        <strong className="font-semibold text-slate-900">{verifiedCount}</strong>{' '}
                        <span className="text-slate-500">grounded & ready</span>
                    </span>
                    <span className={isConfirmed ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                        {isConfirmed ? '✓ Schedule confirmed' : '⚠ Confirm operating schedule below'}
                    </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                    Truth-First Grounding · Zero Hallucinated Claims
                </span>
            </div>

            {/* Main Two-Column Layout */}
            <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                {/* Left Column: Facts & Schedule Confirmer */}
                <section className="min-w-0 space-y-6">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                Verified business facts
                            </h2>
                            <span className="text-xs font-medium text-slate-500">
                                {verifiedCount} of {totalFacts} approved
                            </span>
                        </div>

                        {/* Tabs */}
                        <div
                            role="tablist"
                            className="mt-4 flex gap-6 overflow-x-auto border-b border-slate-200"
                        >
                            {['All facts', 'Verified', 'Needs review'].map((t) => (
                                <button
                                    key={t}
                                    role="tab"
                                    aria-selected={tab === t}
                                    onClick={() => setTab(t)}
                                    className={`min-h-11 shrink-0 border-b-2 text-sm font-medium transition-colors ${
                                        tab === t
                                            ? 'border-indigo-600 text-indigo-700 font-semibold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {t}
                                    {t === 'Needs review' && !isConfirmed && (
                                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                            1
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Facts Table */}
                    {tab !== 'Needs review' && (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="hidden grid-cols-[1fr_1.6fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
                                <span>Fact attribute</span>
                                <span>Grounded value & citation</span>
                                <span>Status</span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {facts.map((f) => (
                                    <div
                                        key={f.label}
                                        className="grid gap-2 p-5 sm:grid-cols-[1fr_1.6fr_auto] sm:gap-4 items-center"
                                    >
                                        <p className="text-sm font-medium text-slate-500">{f.label}</p>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                                                {f.value}
                                            </p>
                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-700">
                                                <Icon name="link" className="h-3 w-3" />
                                                <span>{f.source}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <Badge status={f.verified ? 'Verified' : 'Unavailable'} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schedule Verification Card */}
                    {(tab !== 'Verified' || isConfirmed) && (
                        <article
                            className={`rounded-xl border bg-white p-6 shadow-sm transition-colors ${
                                isConfirmed
                                    ? 'border-slate-200'
                                    : 'border-amber-300 ring-1 ring-amber-200'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-slate-900">
                                            Schedule Verification: Operating Hours
                                        </h3>
                                        <Badge status={isConfirmed ? 'Verified' : 'Needs review'} />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                        {isConfirmed
                                            ? 'Your operating schedule has been confirmed as the verified source of truth.'
                                            : 'Select your standard operating hours or enter custom hours to display on your published website.'}
                                    </p>
                                </div>
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                                    <Icon name="clock" className="h-4 w-4" />
                                </span>
                            </div>

                            <div className="pt-5">
                                {isConfirmed ? (
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {selectedHours === 'custom' ? customHours : selectedHours}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Confirmed by owner · Displayed in website footer & contact
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmed(false)}
                                            className="text-xs font-semibold text-indigo-600 hover:underline"
                                        >
                                            Change schedule
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {[
                                                {
                                                    label: 'Standard Weekday',
                                                    hours: 'Monday – Friday: 9:00 AM – 5:00 PM',
                                                },
                                                {
                                                    label: 'Retail & Services',
                                                    hours: 'Monday – Saturday: 8:00 AM – 6:00 PM',
                                                },
                                                {
                                                    label: 'Daily Schedule',
                                                    hours: 'Daily: 8:00 AM – 8:00 PM',
                                                },
                                                {
                                                    label: 'Weekend Focused',
                                                    hours: 'Saturday & Sunday: 10:00 AM – 6:00 PM',
                                                },
                                            ].map((opt) => (
                                                <label
                                                    key={opt.label}
                                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                                                        selectedHours === opt.hours
                                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                                                            : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="hours-choice"
                                                        checked={selectedHours === opt.hours}
                                                        onChange={() => setSelectedHours(opt.hours)}
                                                        className="mt-0.5 accent-indigo-600"
                                                    />
                                                    <div>
                                                        <span className="block text-xs text-slate-500">
                                                            {opt.label}
                                                        </span>
                                                        <span className="mt-1 block text-sm font-semibold text-slate-900">
                                                            {opt.hours}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        {/* Custom Hours Option */}
                                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                                            <input
                                                type="radio"
                                                name="hours-choice"
                                                checked={selectedHours === 'custom'}
                                                onChange={() => setSelectedHours('custom')}
                                                className="accent-indigo-600"
                                            />
                                            Enter custom operating hours
                                        </label>

                                        {selectedHours === 'custom' && (
                                            <input
                                                type="text"
                                                value={customHours}
                                                onChange={(e) => setCustomHours(e.target.value)}
                                                placeholder="e.g. Tuesday – Sunday: 9:00 AM – 4:00 PM"
                                                className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            />
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-xs text-slate-400">
                                                Only genuine information provided by you will be published.
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleConfirmSchedule}
                                                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                                            >
                                                Confirm schedule
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </article>
                    )}
                </section>

                {/* Right Column: Source Evidence Library */}
                <aside className="space-y-6 min-w-0">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Evidence library
                                </h3>
                                <p className="text-xs text-slate-500">The verified sources behind the website</p>
                            </div>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {sources.length} sources
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {sources.map((s, idx) => (
                                <div key={idx} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-indigo-600">
                                            <Icon name="globe" className="h-4 w-4" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800 truncate">
                                                {s.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500">{s.detail}</p>
                                        </div>
                                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            {s.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-500 leading-relaxed">
                        <p className="font-semibold text-slate-700 mb-1">VerityWeb Grounding Guarantee</p>
                        Our synthesis engine never invents testimonials, fabricated customer quotes, prices, awards, or fake accreditations. Missing information is either requested or omitted.
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
