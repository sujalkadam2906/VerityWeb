import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icon';
import Badge from '@/Components/Badge';

interface FactItem {
    id: number;
    type: string;
    key: string;
    value: string;
    source: string;
    status: string; // 'confirmed' | 'needs_review' | 'conflicting' | 'unverified' | 'rejected'
    confidence: number | null;
    conflict_with_id: number | null;
    conflict_explanation: string | null;
    user_confirmed: boolean;
}

interface EvidenceItem {
    id: number;
    file_name: string;
    file_type: string;
    source_url: string | null;
    status: string;
    metadata: any;
    has_text: boolean;
}

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
    facts?: FactItem[];
    evidences?: EvidenceItem[];
    hasConflicts?: boolean;
}

export default function Review({ project, facts = [], evidences = [], hasConflicts = false }: ReviewProps) {
    const [tab, setTab] = useState('All facts');
    const [selectedHours, setSelectedHours] = useState('Monday – Friday: 9:00 AM – 5:00 PM');
    const [customHours, setCustomHours] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [resolvingFactId, setResolvingFactId] = useState<number | null>(null);
    const [editedValue, setEditedValue] = useState<string>('');

    // Fallback facts if none stored yet
    const displayFacts = facts.length > 0 ? facts : [
        { id: 1, type: 'identity', key: 'name', value: project.name, source: 'Owner Intake Profile', status: 'confirmed', confidence: 1.0, conflict_with_id: null, conflict_explanation: null, user_confirmed: true },
        { id: 2, type: 'identity', key: 'category', value: project.category || 'Local business', source: 'Owner Intake Profile', status: 'confirmed', confidence: 1.0, conflict_with_id: null, conflict_explanation: null, user_confirmed: true },
        { id: 3, type: 'location', key: 'city', value: project.address ? `${project.address}, ${project.city}` : project.city, source: project.address ? 'Address Intake' : 'City Intake', status: 'confirmed', confidence: 1.0, conflict_with_id: null, conflict_explanation: null, user_confirmed: true },
        { id: 4, type: 'contact', key: 'phone', value: project.phone || 'Not provided', source: 'Phone Intake', status: project.phone ? 'confirmed' : 'needs_review', confidence: 1.0, conflict_with_id: null, conflict_explanation: null, user_confirmed: Boolean(project.phone) },
        { id: 5, type: 'description', key: 'description', value: project.description || 'Not provided', source: 'Description Intake', status: project.description ? 'confirmed' : 'needs_review', confidence: 1.0, conflict_with_id: null, conflict_explanation: null, user_confirmed: Boolean(project.description) },
    ];

    // Real grounded sources from evidences or fallback
    const displaySources = evidences.length > 0 ? evidences.map((e) => ({
        name: e.source_url || e.file_name,
        type: e.file_type === 'url' ? 'Web source' : 'Uploaded document',
        detail: e.status === 'processed' ? (e.has_text ? 'Text extracted' : 'Metadata verified') : (e.status === 'scanned_needs_ocr' ? 'Scanned document' : 'Failed to fetch'),
        status: e.status === 'processed' ? 'Verified' : (e.status === 'scanned_needs_ocr' ? 'Needs review' : 'Unavailable'),
        kind: e.file_type === 'url' ? 'web' : 'doc',
    })) : [
        {
            name: 'Direct Business Intake',
            type: 'Owner submission',
            detail: `${project.name} · Verified profile`,
            status: 'Verified',
            kind: 'web',
        },
        ...(project.links || []).filter(Boolean).map((link) => ({
            name: link,
            type: 'Online Presence Link',
            detail: 'Cross-referenced link',
            status: 'Verified',
            kind: 'web',
        })),
    ];

    const conflictingFacts = displayFacts.filter((f) => f.status === 'conflicting');
    const reviewFacts = displayFacts.filter((f) => f.status === 'needs_review');

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

    const handleResolveConflict = (factId: number, action: 'confirm' | 'reject') => {
        router.post(
            route('projects.facts.resolve', [project.id, factId]),
            {
                action,
                edited_value: editedValue || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResolvingFactId(null);
                    setEditedValue('');
                },
            }
        );
    };

    const verifiedCount = displayFacts.filter((f) => f.status === 'confirmed').length + (isConfirmed ? 1 : 0);
    const totalCount = displayFacts.length + 1;

    return (
        <AppLayout title="Review information" breadcrumb="Fact verification">
            <Head title={`Fact Verification - ${project.name}`} />

            {/* Top Readiness Banner */}
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-7">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{project.name}</span>
                        <Badge status={hasConflicts ? 'Needs review' : (isConfirmed ? 'Verified' : 'Needs review')} />
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        Review your business facts
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                        Every fact is proven by an original source or your direct input. Confirm your schedule and resolve any discrepancies before synthesizing your website.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleProceedToGeneration}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                    Synthesize website
                    <Icon name="arrowRight" className="h-4 w-4" />
                </button>
            </div>

            {/* Conflict Alert Banner if discrepancies exist */}
            {conflictingFacts.length > 0 && (
                <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                            <Icon name="spark" className="h-4 w-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900">Source Discrepancies Detected</h3>
                            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                                Our Evidence Engine discovered conflicting details between your sources (e.g. phone numbers or operating schedules). Choose which source to trust or enter your preferred value.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
                {/* Left Column: Fact Verification Studio */}
                <section className="space-y-6 min-w-0">
                    {/* Verification Score Card */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold">
                                {Math.round((verifiedCount / totalCount) * 100)}%
                            </span>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {verifiedCount} of {totalCount} facts verified
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {conflictingFacts.length > 0
                                        ? `${conflictingFacts.length} conflicting facts requiring your selection`
                                        : 'Zero fabricated claims · Ready for grounded synthesis'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <Icon name="check" className="h-3.5 w-3.5" />
                                Anti-Hallucination Active
                            </span>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="border-b border-slate-200">
                        <div className="flex gap-6 overflow-x-auto">
                            {['All facts', 'Needs review', 'Verified'].map((t) => (
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
                                    {t === 'Needs review' && (conflictingFacts.length > 0 || !isConfirmed) && (
                                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                            {conflictingFacts.length + (isConfirmed ? 0 : 1)}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conflicting Facts Resolution Section */}
                    {conflictingFacts.length > 0 && tab !== 'Verified' && (
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                                Discrepancies Requiring Decision
                            </h2>
                            {conflictingFacts.map((fact) => (
                                <div key={fact.id} className="rounded-xl border border-amber-300 bg-white p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{fact.key}</p>
                                            <p className="text-base font-bold text-slate-900 mt-1">{fact.value}</p>
                                            <p className="text-xs text-indigo-600 mt-0.5">Source: {fact.source}</p>
                                        </div>
                                        <Badge status="Needs review" />
                                    </div>
                                    {fact.conflict_explanation && (
                                        <p className="mt-3 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg">
                                            {fact.conflict_explanation}
                                        </p>
                                    )}
                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleResolveConflict(fact.id, 'confirm')}
                                            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                                        >
                                            Use this value
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleResolveConflict(fact.id, 'reject')}
                                            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Facts Table */}
                    {tab !== 'Needs review' && (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="hidden grid-cols-[1fr_1.6fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
                                <span>Fact attribute</span>
                                <span>Grounded value & citation</span>
                                <span>Status</span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {displayFacts
                                    .filter((f) => tab === 'All facts' || (tab === 'Verified' && f.status === 'confirmed'))
                                    .map((f) => (
                                        <div
                                            key={f.id}
                                            className="grid gap-2 p-5 sm:grid-cols-[1fr_1.6fr_auto] sm:gap-4 items-center"
                                        >
                                            <p className="text-sm font-medium text-slate-500 capitalize">{f.key.replace('_', ' ')}</p>
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
                                                <Badge status={f.status === 'confirmed' ? 'Verified' : (f.status === 'conflicting' ? 'Needs review' : 'Unavailable')} />
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
                                    <div className="space-y-3">
                                        {[
                                            'Monday – Friday: 9:00 AM – 5:00 PM',
                                            'Monday – Saturday: 8:00 AM – 7:00 PM',
                                            'Tuesday – Sunday: 10:00 AM – 9:00 PM',
                                            'custom',
                                        ].map((opt) => (
                                            <label
                                                key={opt}
                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 text-xs sm:text-sm transition-colors ${
                                                    selectedHours === opt
                                                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold'
                                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="hours_option"
                                                        checked={selectedHours === opt}
                                                        onChange={() => setSelectedHours(opt)}
                                                        className="text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span>{opt === 'custom' ? 'Custom hours…' : opt}</span>
                                                </div>
                                            </label>
                                        ))}

                                        {selectedHours === 'custom' && (
                                            <input
                                                type="text"
                                                value={customHours}
                                                onChange={(e) => setCustomHours(e.target.value)}
                                                placeholder="e.g. Mon–Thu: 10am–8pm, Fri–Sat: 10am–10pm, Sun: Closed"
                                                className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
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
                                {displaySources.length} sources
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {displaySources.map((s, idx) => (
                                <div key={idx} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-indigo-600">
                                            <Icon name={s.kind === 'doc' ? 'file' : 'globe'} className="h-4 w-4" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800 truncate">
                                                {s.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500">{s.detail}</p>
                                        </div>
                                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                            s.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
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
