import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import Icon from '@/Components/Icon';

interface Project {
    id: number;
    name: string;
    city: string;
    category: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    slug: string;
    theme_settings: {
        color?: string;
        font?: string;
        spacing?: number;
    } | null;
    sections_data: {
        sections?: string[];
        hidden?: string[];
        headline?: string;
        subheadline?: string;
        cta?: string;
        operating_hours?: string;
        services?: Array<{ title: string; desc: string }>;
    } | null;
}

interface EditorProps {
    project: Project;
}

export default function Editor({ project }: EditorProps) {
    const initialSections = project.sections_data?.sections || [
        'Hero',
        'Story',
        'Services',
        'Operating Hours',
        'Location & Contact',
    ];
    const [sections, setSections] = useState<string[]>(initialSections);
    const [selectedSection, setSelectedSection] = useState('Hero');
    const [hiddenSections, setHiddenSections] = useState<string[]>(
        project.sections_data?.hidden || []
    );

    // Theme Tokens
    const [color, setColor] = useState(project.theme_settings?.color || '#4F46E5');
    const [font, setFont] = useState(project.theme_settings?.font || 'Modern');
    const [spacing, setSpacing] = useState(project.theme_settings?.spacing || 48);

    // Content Fields
    const [headline, setHeadline] = useState(
        project.sections_data?.headline || project.name
    );
    const [subheadline, setSubheadline] = useState(
        project.sections_data?.subheadline ||
            `Dedicated to serving ${project.city} with trusted, professional ${project.category} services.`
    );
    const [cta, setCta] = useState(project.sections_data?.cta || 'Contact Us');
    const [storyHeadline, setStoryHeadline] = useState(
        (project.sections_data as any)?.story_headline || 'Good things happen in welcoming places.'
    );
    const [storyText, setStoryText] = useState(
        (project.sections_data as any)?.story_text || project.description || `Proudly serving ${project.city} with dedicated craft, authentic quality, and a comfortable place to feel at home.`
    );
    const [services, setServices] = useState<Array<{ title: string; desc: string }>>(
        project.sections_data?.services || [
            { title: 'Specialty Quality', desc: 'Crafted with premium ingredients and attention to every detail.' },
            { title: 'Daily Offerings', desc: 'Fresh batches made every morning for our neighborhood.' },
            { title: 'Friendly Gathering', desc: 'A comfortable corner for quick stops or leisurely visits.' },
        ]
    );
    const [operatingHours, setOperatingHours] = useState(
        project.sections_data?.operating_hours || 'Monday – Friday: 9:00 AM – 5:00 PM'
    );
    const [address, setAddress] = useState(
        (project.sections_data as any)?.address || project.address || ''
    );
    const [phone, setPhone] = useState(
        (project.sections_data as any)?.phone || project.phone || ''
    );

    // UI Viewport & State
    const [device, setDevice] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
    const [previewMode, setPreviewMode] = useState(false);
    const [saveStatus, setSaveStatus] = useState('All changes saved');

    // Headline Style Assistant
    const [prompt, setPrompt] = useState(`Polish headline for ${project.category} in ${project.city}`);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    const markDirty = () => setSaveStatus('Unsaved changes');

    const handleSave = () => {
        router.patch(
            route('projects.update-sections', project.id),
            {
                sections_data: {
                    sections,
                    hidden: hiddenSections,
                    headline,
                    subheadline,
                    cta,
                    story_headline: storyHeadline,
                    story_text: storyText,
                    services,
                    operating_hours: operatingHours,
                    address,
                    phone,
                },
                theme_settings: {
                    color,
                    font,
                    spacing,
                },
            },
            {
                preserveScroll: true,
                onSuccess: () => setSaveStatus('All changes saved'),
            }
        );
    };

    const updateServiceItem = (index: number, field: 'title' | 'desc', val: string) => {
        const copy = [...services];
        copy[index] = { ...copy[index], [field]: val };
        setServices(copy);
        markDirty();
    };

    const addServiceItem = () => {
        setServices([...services, { title: 'New Service', desc: 'Description of service offering.' }]);
        markDirty();
    };

    const removeServiceItem = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
        markDirty();
    };

    const handleReorder = (name: string, delta: number) => {
        const curIndex = sections.indexOf(name);
        const nextIndex = curIndex + delta;
        if (nextIndex < 0 || nextIndex >= sections.length) return;
        const copy = [...sections];
        copy.splice(curIndex, 1);
        copy.splice(nextIndex, 0, name);
        setSections(copy);
        markDirty();
    };

    const toggleVisibility = (name: string) => {
        setHiddenSections((prev) =>
            prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
        );
        markDirty();
    };

    const handleRunAi = async () => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setAiSuggestion(null);

        try {
            const res = await axios.post(route('projects.regenerate-section', project.id), {
                section_name: selectedSection,
                prompt: prompt,
            });

            if (res.data?.success && res.data.sections_data) {
                const updated = res.data.sections_data;
                if (updated.headline) setHeadline(updated.headline);
                if (updated.subheadline) setSubheadline(updated.subheadline);
                if (updated.cta) setCta(updated.cta);
                if (updated.operating_hours) setOperatingHours(updated.operating_hours);
                setAiSuggestion(res.data.suggestion || 'Section regenerated successfully.');
                markDirty();
            }
        } catch (e) {
            console.error('Failed to regenerate section:', e);
            setAiSuggestion(`Excellence in ${project.category} · Serving ${project.city}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const applyAiSuggestion = () => {
        if (!aiSuggestion) return;
        setHeadline(aiSuggestion);
        setAiSuggestion(null);
        markDirty();
    };

    const headingFont =
        font === 'Modern'
            ? 'Inter, sans-serif'
            : font === 'Classic'
            ? 'Georgia, serif'
            : "'DM Serif Display', Georgia, serif";

    return (
        <div className="min-h-screen bg-[#f7f8fa] font-sans text-[#172033]">
            <Head title={`Website Editor - ${project.name}`} />

            {/* Top Editor Utility Header */}
            <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 lg:px-8">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('dashboard')}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                        title="Back to websites"
                    >
                        <Icon name="shield" className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>My Websites</span>
                            <Icon name="arrow" className="h-3 w-3 text-slate-400" />
                            <span className="font-semibold text-slate-800">{project.name}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{saveStatus}</p>
                    </div>
                </div>

                {/* Viewport Switcher */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    {(['Desktop', 'Tablet', 'Mobile'] as const).map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDevice(d)}
                            aria-label={`${d} preview`}
                            className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                                device === d
                                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Icon
                                name={d === 'Desktop' ? 'monitor' : 'phone'}
                                className={d === 'Tablet' ? 'h-4 w-5' : 'h-4 w-4'}
                            />
                        </button>
                    ))}
                </div>

                {/* Save, Preview & Publish Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => setPreviewMode(!previewMode)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <Icon name="eye" className="h-4 w-4 text-slate-500" />
                        {previewMode ? 'Exit preview' : 'Full preview'}
                    </button>
                    <Link
                        href={route('projects.publish', project.id)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                    >
                        Publish website
                        <Icon name="external" className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </header>

            {/* AI Prompt Bar */}
            <div className="mx-auto max-w-4xl px-4 pt-5 pb-3">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 pl-4 shadow-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-indigo-600">
                        <Icon name="spark" className="h-4 w-4" />
                    </span>
                    <input
                        aria-label="AI section prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe a change to the selected section…"
                        className="min-h-10 min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 sm:block">
                        {selectedSection}
                    </span>
                    <button
                        type="button"
                        disabled={isGenerating || !prompt.trim()}
                        onClick={handleRunAi}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Icon name="spark" className="h-3.5 w-3.5" />
                        {isGenerating ? 'Synthesizing…' : 'Regenerate'}
                    </button>
                </div>

                {/* Staged AI Suggestion Banner */}
                {aiSuggestion && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-indigo-900">
                                AI Suggestion for {selectedSection}:
                            </p>
                            <p className="mt-0.5 text-sm font-serif italic text-slate-900">
                                "{aiSuggestion}"
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setAiSuggestion(null)}
                                className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Dismiss
                            </button>
                            <button
                                type="button"
                                onClick={applyAiSuggestion}
                                className="min-h-9 rounded-lg bg-indigo-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                Apply to {selectedSection}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main 3-Column Studio Layout */}
            <div className="px-4 pb-8 lg:px-6">
                <div
                    className={`grid items-start gap-5 ${
                        previewMode
                            ? ''
                            : 'md:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[210px_minmax(0,1fr)_280px]'
                    }`}
                >
                    {/* Column 1: Page Structure Sidebar */}
                    {!previewMode && (
                        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Page structure
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                    {sections.length} sections
                                </span>
                            </div>

                            <div className="space-y-1">
                                {sections.map((s, idx) => (
                                    <div
                                        key={s}
                                        className={`group flex items-center rounded-lg border transition-colors ${
                                            selectedSection === s
                                                ? 'border-indigo-200 bg-indigo-50/70 text-indigo-700 font-semibold'
                                                : 'border-transparent text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSection(s)}
                                            className="flex min-h-10 min-w-0 flex-1 items-center gap-2 px-2.5 text-left text-xs"
                                        >
                                            <span className="cursor-grab text-slate-300">⠿</span>
                                            <span className="truncate">{s}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleVisibility(s)}
                                            className={`flex h-10 w-9 shrink-0 items-center justify-center text-xs ${
                                                hiddenSections.includes(s)
                                                    ? 'text-slate-300 line-through'
                                                    : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                            title="Toggle visibility"
                                        >
                                            <Icon name="eye" className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Section Reorder Controls */}
                            <div className="mt-5 border-t border-slate-100 pt-3">
                                <p className="text-[11px] font-medium text-slate-400">
                                    Reorder selected section
                                </p>
                                <div className="mt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleReorder(selectedSection, -1)}
                                        className="min-h-9 flex-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                        ↑ Move up
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleReorder(selectedSection, 1)}
                                        className="min-h-9 flex-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                        ↓ Move down
                                    </button>
                                </div>
                            </div>
                        </aside>
                    )}

                    {/* Column 2: Live Website Preview Canvas */}
                    <section className="min-w-0">
                        {/* Browser Window Frame */}
                        <div
                            className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all duration-300 ${
                                device === 'Mobile'
                                    ? 'max-w-sm'
                                    : device === 'Tablet'
                                    ? 'max-w-xl'
                                    : 'max-w-5xl'
                            }`}
                        >
                            {/* Window Controls & URL bar */}
                            <div className="flex h-11 items-center gap-3 border-b border-slate-200 bg-slate-50 px-4">
                                <div className="flex gap-1.5" aria-hidden="true">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#f1aaa5]" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#edcf88]" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#9acdad]" />
                                </div>
                                <span className="mx-auto flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-4 py-1 text-[11px] text-slate-600">
                                    <Icon name="shield" className="h-3 w-3 text-emerald-600" />
                                    verityweb.example/sites/{project.slug}
                                </span>
                            </div>

                            {/* Rendered Business Website Preview */}
                            <div
                                className="max-h-[740px] overflow-y-auto bg-[#f8f5ed] transition-colors"
                                style={{ color }}
                            >
                                {/* Header / Nav */}
                                <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-6 py-5">
                                    <span
                                        style={{ fontFamily: headingFont }}
                                        className="text-xl tracking-tight"
                                    >
                                        {project.name}
                                    </span>
                                    <div className="flex items-center gap-4 text-xs">
                                        <a href="#story" className="hover:underline">
                                            Our story
                                        </a>
                                        <a href="#services" className="hover:underline">
                                            Services
                                        </a>
                                        <a
                                            href="#contact"
                                            className="border-b border-current hover:opacity-80"
                                        >
                                            Visit us ↗
                                        </a>
                                    </div>
                                </nav>

                                {/* Sections Loop */}
                                {sections
                                    .filter((s) => !hiddenSections.includes(s))
                                    .map((s) => (
                                        <div
                                            key={s}
                                            id={`canvas-${s}`}
                                            onClick={() => !previewMode && setSelectedSection(s)}
                                            className={`relative cursor-pointer transition-shadow ${
                                                !previewMode && selectedSection === s
                                                    ? 'ring-2 ring-inset ring-indigo-500'
                                                    : 'hover:ring-1 hover:ring-slate-300'
                                            }`}
                                        >
                                            {!previewMode && selectedSection === s && (
                                                <span className="absolute left-2 top-2 z-10 rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                                                    {s} Section
                                                </span>
                                            )}

                                            {/* Hero Section */}
                                            {s === 'Hero' && (
                                                <div
                                                    className="px-6 text-center sm:px-12"
                                                    style={{
                                                        paddingTop: spacing + 10,
                                                        paddingBottom: spacing,
                                                    }}
                                                >
                                                    <p className="text-[11px] uppercase tracking-[0.18em]">
                                                        {project.city} · {project.category}
                                                    </p>
                                                    <h1
                                                        style={{ fontFamily: headingFont }}
                                                        className="mx-auto mt-4 max-w-xl text-3xl sm:text-4xl md:text-5xl leading-tight break-words"
                                                    >
                                                        {headline}
                                                    </h1>
                                                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-stone-600">
                                                        {subheadline}
                                                    </p>
                                                    <a
                                                        href="#services"
                                                        style={{ backgroundColor: color }}
                                                        className="mt-6 inline-flex min-h-11 items-center gap-3 rounded px-6 text-xs font-semibold text-white shadow-sm"
                                                    >
                                                        {cta} <span>↗</span>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Story Section */}
                                            {s === 'Story' && (
                                                <div
                                                    id="story"
                                                    className="px-8 text-center"
                                                    style={{
                                                        paddingTop: spacing,
                                                        paddingBottom: spacing,
                                                    }}
                                                >
                                                    <p className="text-[11px] uppercase tracking-widest">
                                                        About our space
                                                    </p>
                                                    <h2
                                                        style={{ fontFamily: headingFont }}
                                                        className="mx-auto mt-3 max-w-md text-3xl leading-snug"
                                                    >
                                                        {storyHeadline}
                                                    </h2>
                                                    <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-stone-600">
                                                        {storyText}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Services Section */}
                                            {s === 'Services' && (
                                                <div
                                                    id="services"
                                                    className="bg-[#e9eddf] px-8"
                                                    style={{
                                                        paddingTop: spacing,
                                                        paddingBottom: spacing,
                                                    }}
                                                >
                                                    <h2
                                                        style={{ fontFamily: headingFont }}
                                                        className="mb-6 text-3xl text-center"
                                                    >
                                                        Made with care.
                                                    </h2>
                                                    <div
                                                        className={`grid gap-6 ${
                                                            device !== 'Mobile'
                                                                ? 'sm:grid-cols-3'
                                                                : ''
                                                        }`}
                                                    >
                                                        {services.map((srv, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="border-t border-current pt-4"
                                                            >
                                                                <span className="text-xs font-mono">
                                                                    0{idx + 1}
                                                                </span>
                                                                <h3
                                                                    style={{
                                                                        fontFamily: headingFont,
                                                                    }}
                                                                    className="mt-2 text-xl"
                                                                >
                                                                    {srv.title}
                                                                </h3>
                                                                <p className="mt-2 text-xs leading-5 text-stone-600">
                                                                    {srv.desc}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Menu Gallery Section */}
                                            {s === 'Menu Gallery' && (
                                                <div
                                                    className="px-8 text-center"
                                                    style={{
                                                        paddingTop: spacing,
                                                        paddingBottom: spacing,
                                                    }}
                                                >
                                                    <h2
                                                        style={{ fontFamily: headingFont }}
                                                        className="mb-4 text-3xl"
                                                    >
                                                        Your next favorite moment.
                                                    </h2>
                                                    <div className="mx-auto flex h-48 w-full max-w-xl items-center justify-center rounded-lg bg-stone-200">
                                                        <svg
                                                            role="img"
                                                            viewBox="0 0 600 400"
                                                            className="h-full w-full object-cover rounded-lg"
                                                        >
                                                            <path
                                                                fill="#54735e"
                                                                d="M0 280 160 100l150 180 120-120 170 180v60H0z"
                                                            />
                                                            <circle
                                                                fill="#f4d6a3"
                                                                cx="440"
                                                                cy="90"
                                                                r="45"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Operating Hours */}
                                            {s === 'Operating Hours' && (
                                                <div
                                                    className="bg-[#eeeadf] px-8 text-center"
                                                    style={{
                                                        paddingTop: spacing,
                                                        paddingBottom: spacing,
                                                    }}
                                                >
                                                    <p className="text-[11px] uppercase tracking-widest font-semibold text-stone-600">
                                                        Operating Schedule
                                                    </p>
                                                    <h3
                                                        style={{ fontFamily: headingFont }}
                                                        className="mx-auto mt-2 text-2xl font-semibold"
                                                    >
                                                        When We Are Open
                                                    </h3>
                                                    <p className="mt-2 text-sm text-stone-700 font-medium">
                                                        {operatingHours}
                                                    </p>
                                                    <p className="mt-2 text-xs text-stone-500">
                                                        Verified business hours
                                                    </p>
                                                </div>
                                            )}

                                            {/* Location & Contact */}
                                            {(s === 'Location & Contact' || s === 'Map & Contact') && (
                                                <div
                                                    id="contact"
                                                    className="px-8 text-center"
                                                    style={{
                                                        paddingTop: spacing,
                                                        paddingBottom: spacing,
                                                    }}
                                                >
                                                    <p className="text-[11px] uppercase tracking-widest font-semibold text-stone-600">
                                                        Get In Touch
                                                    </p>
                                                    <h2
                                                        style={{ fontFamily: headingFont }}
                                                        className="mt-2 text-3xl font-semibold"
                                                    >
                                                        Visit Our Location
                                                    </h2>
                                                    <p className="mt-2 text-sm text-stone-700 font-medium">
                                                        {address ? `${address}, ` : ''}{project.city}
                                                    </p>
                                                    {phone && (
                                                        <p className="mt-1 text-xs text-stone-600">
                                                            Phone: {phone}
                                                        </p>
                                                    )}
                                                    {phone && (
                                                        <a
                                                            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                                                            className="mt-4 inline-flex min-h-10 items-center border-b border-current text-xs font-semibold"
                                                        >
                                                            Call us directly ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                {/* Footer */}
                                <footer
                                    style={{ backgroundColor: color }}
                                    className="flex flex-wrap items-center justify-between gap-3 px-8 py-6 text-xs text-white"
                                >
                                    <span>{project.name}</span>
                                    <span>Made with VerityWeb · Truth-First Generation</span>
                                </footer>
                            </div>
                        </div>
                    </section>

                    {/* Column 3: Inspector & Design Tokens */}
                    {!previewMode && (
                        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
                            {/* Section Content Editor */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Edit {selectedSection}
                                </h3>

                                <div className="mt-4 space-y-4">
                                    {selectedSection === 'Hero' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">
                                                    Headline
                                                </label>
                                                <input
                                                    type="text"
                                                    value={headline}
                                                    onChange={(e) => {
                                                        setHeadline(e.target.value);
                                                        markDirty();
                                                    }}
                                                    className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">
                                                    Description
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={subheadline}
                                                    onChange={(e) => {
                                                        setSubheadline(e.target.value);
                                                        markDirty();
                                                    }}
                                                    className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">
                                                    Button label
                                                </label>
                                                <input
                                                    type="text"
                                                    value={cta}
                                                    onChange={(e) => {
                                                        setCta(e.target.value);
                                                        markDirty();
                                                    }}
                                                    className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {selectedSection === 'Story' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">
                                                    Story Heading
                                                </label>
                                                <input
                                                    type="text"
                                                    value={storyHeadline}
                                                    onChange={(e) => {
                                                        setStoryHeadline(e.target.value);
                                                        markDirty();
                                                    }}
                                                    className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">
                                                    About & Story Copy
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    value={storyText}
                                                    onChange={(e) => {
                                                        setStoryText(e.target.value);
                                                        markDirty();
                                                    }}
                                                    className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {selectedSection === 'Services' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-700">Service Offerings</span>
                                                <button
                                                    type="button"
                                                    onClick={addServiceItem}
                                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                                >
                                                    + Add service
                                                </button>
                                            </div>
                                            {services.map((srv, idx) => (
                                                <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-mono text-slate-400">0{idx + 1}</span>
                                                        {services.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeServiceItem(idx)}
                                                                className="text-xs text-slate-400 hover:text-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={srv.title}
                                                        onChange={(e) => updateServiceItem(idx, 'title', e.target.value)}
                                                        placeholder="Service Title"
                                                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                    <textarea
                                                        rows={2}
                                                        value={srv.desc}
                                                        onChange={(e) => updateServiceItem(idx, 'desc', e.target.value)}
                                                        placeholder="Service Description"
                                                        className="w-full rounded border border-slate-200 bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedSection === 'Operating Hours' && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700">
                                                Operating Schedule
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={operatingHours}
                                                onChange={(e) => {
                                                    setOperatingHours(e.target.value);
                                                    markDirty();
                                                }}
                                                placeholder="e.g. Mon–Fri: 9:00 AM – 5:00 PM"
                                                className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            />
                                        </div>
                                    )}

                                    {(selectedSection === 'Location & Contact' || selectedSection === 'Map & Contact') && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">
                                                    Street Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={address}
                                                    onChange={(e) => {
                                                        setAddress(e.target.value);
                                                        markDirty();
                                                    }}
                                                    placeholder="e.g. 124 Maple Street"
                                                    className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={phone}
                                                    onChange={(e) => {
                                                        setPhone(e.target.value);
                                                        markDirty();
                                                    }}
                                                    placeholder="e.g. (503) 555-0142"
                                                    className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Design Tokens: Color, Typography, Spacing */}
                            <div className="border-t border-slate-100 pt-5 space-y-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Design tokens
                                </h3>

                                {/* Colors */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-2">
                                        Brand primary color
                                    </label>
                                    <div className="flex gap-2">
                                        {['#344d3c', '#4338ca', '#1f565a', '#7b3e38'].map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => {
                                                    setColor(c);
                                                    markDirty();
                                                }}
                                                style={{ backgroundColor: c }}
                                                className={`h-8 w-8 rounded-md border-2 border-white shadow-sm transition-transform ${
                                                    color === c ? 'scale-110 ring-2 ring-indigo-500' : ''
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Typography Presets */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-2">
                                        Typography preset
                                    </label>
                                    <div className="space-y-1.5">
                                        {[
                                            { name: 'Editorial', desc: 'DM Serif Display + Inter' },
                                            { name: 'Modern', desc: 'Inter + Inter' },
                                            { name: 'Classic', desc: 'Georgia + Inter' },
                                        ].map((t) => (
                                            <button
                                                key={t.name}
                                                type="button"
                                                onClick={() => {
                                                    setFont(t.name);
                                                    markDirty();
                                                }}
                                                className={`w-full rounded-lg border p-2 text-left text-xs transition-colors ${
                                                    font === t.name
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>{t.name}</span>
                                                <span className="block text-[10px] text-slate-400 font-normal">
                                                    {t.desc}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Spacing */}
                                <div>
                                    <div className="flex justify-between text-xs font-medium text-slate-700">
                                        <span>Section spacing</span>
                                        <span className="font-mono text-slate-500">{spacing}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={24}
                                        max={72}
                                        step={8}
                                        value={spacing}
                                        onChange={(e) => {
                                            setSpacing(Number(e.target.value));
                                            markDirty();
                                        }}
                                        className="mt-2 w-full accent-indigo-600 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}
