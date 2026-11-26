import React from 'react';
import { Head } from '@inertiajs/react';

interface ProjectData {
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
        headline?: string;
        subheadline?: string;
        cta?: string;
        operating_hours?: string;
        services?: Array<{ title: string; desc: string }>;
    } | null;
}

interface PublicProps {
    project: ProjectData;
}

export default function Public({ project }: PublicProps) {
    const color = project.theme_settings?.color || '#344d3c';
    const font = project.theme_settings?.font || 'Editorial';
    const spacing = project.theme_settings?.spacing || 48;

    const headline =
        project.sections_data?.headline || 'Good coffee. Better company.';
    const subheadline =
        project.sections_data?.subheadline ||
        `Thoughtfully brewed coffee, seasonal bakes, and a welcoming corner in ${project.city}.`;
    const cta = project.sections_data?.cta || 'Explore our menu';

    const headingFont =
        font === 'Modern'
            ? 'Inter, sans-serif'
            : font === 'Classic'
            ? 'Georgia, serif'
            : "'DM Serif Display', Georgia, serif";

    return (
        <div className="min-h-screen bg-[#f8f5ed] font-sans text-[#304735]">
            <Head title={`${project.name} - ${project.city}`} />

            {/* Top VerityWeb Badge Header for Public Viewers */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#172033] px-6 py-2.5 text-xs text-white">
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Official Published Website</span>
                </div>
                <span className="text-slate-400">
                    Verified & Powered by <strong>VerityWeb</strong>
                </span>
            </div>

            {/* Business Website Navigation */}
            <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 px-6 py-6 sm:px-12">
                <span style={{ fontFamily: headingFont }} className="text-2xl font-bold tracking-tight">
                    {project.name}
                </span>
                <div className="flex items-center gap-6 text-xs font-medium">
                    <a href="#story" className="hover:underline">
                        Our story
                    </a>
                    <a href="#services" className="hover:underline">
                        Services
                    </a>
                    <a
                        href="#contact"
                        style={{ borderColor: color }}
                        className="border-b-2 pb-0.5 hover:opacity-80"
                    >
                        Visit us ↗
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <section
                className="px-6 text-center sm:px-12"
                style={{ paddingTop: spacing + 20, paddingBottom: spacing + 10 }}
            >
                <p className="text-xs uppercase tracking-[0.2em] text-[#596451] font-semibold">
                    {project.city} · {project.category}
                </p>
                <h1
                    style={{ fontFamily: headingFont }}
                    className="mx-auto mt-5 max-w-2xl text-5xl leading-tight sm:text-6xl"
                >
                    {headline}
                </h1>
                <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#596451]">
                    {subheadline}
                </p>
                <a
                    href="#services"
                    style={{ backgroundColor: color }}
                    className="mt-8 inline-flex min-h-12 items-center gap-3 rounded px-8 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                >
                    {cta} <span>↗</span>
                </a>
            </section>

            {/* Illustrated Landscape Banner */}
            <div className="mx-auto max-w-4xl px-6 pb-12">
                <div className="overflow-hidden rounded-2xl shadow-lg bg-stone-200 h-64 sm:h-80 flex items-center justify-center">
                    <svg
                        role="img"
                        aria-label="Artisan café landscape"
                        viewBox="0 0 600 400"
                        className="h-full w-full object-cover"
                    >
                        <path fill="#54735e" d="M0 280 160 100l150 180 120-120 170 180v60H0z" />
                        <circle fill="#f4d6a3" cx="440" cy="90" r="45" />
                    </svg>
                </div>
            </div>

            {/* Story Section */}
            <section
                id="story"
                className="px-8 text-center"
                style={{ paddingTop: spacing, paddingBottom: spacing }}
            >
                <p className="text-xs uppercase tracking-[0.2em] text-[#596451] font-semibold">
                    More than a business
                </p>
                <h2
                    style={{ fontFamily: headingFont }}
                    className="mx-auto mt-4 max-w-lg text-3xl leading-snug sm:text-4xl"
                >
                    A familiar face. A favorite corner.
                    <br />
                    Something made with care.
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#596451]">
                    {project.description ||
                        `Proudly serving the ${project.city} community with dedicated craft, authentic local ingredients, and a warm neighborhood welcome.`}
                </p>
            </section>

            {/* Services Section */}
            <section
                id="services"
                className="bg-[#e9eddf] px-8 sm:px-14"
                style={{ paddingTop: spacing + 10, paddingBottom: spacing + 10 }}
            >
                <div className="mx-auto max-w-5xl">
                    <div className="mb-8 flex items-center justify-between">
                        <h2 style={{ fontFamily: headingFont }} className="text-3xl">
                            What we offer
                        </h2>
                        <span className="text-xs font-semibold text-[#596451]">
                            Authentic & Grounded
                        </span>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-3">
                        {(
                            project.sections_data?.services || [
                                {
                                    title: 'Specialty Roasts',
                                    desc: 'Ethically sourced single origins and balanced daily house blends.',
                                },
                                {
                                    title: 'Fresh Bakes',
                                    desc: 'Warm croissants, brioche, and seasonal tarts out of the oven every morning.',
                                },
                                {
                                    title: 'Neighborhood Gathering',
                                    desc: 'A calm space designed for productive work or catching up with friends.',
                                },
                            ]
                        ).map((s, idx) => (
                            <div key={s.title} className="border-t border-[#9ba991] pt-5">
                                <span className="font-mono text-xs text-[#596451]">0{idx + 1}</span>
                                <h3 style={{ fontFamily: headingFont }} className="mt-3 text-2xl">
                                    {s.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-[#596451]">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Operating Hours Section */}
            {project.sections_data?.operating_hours && (
                <section
                    id="hours"
                    className="px-8 text-center bg-[#f0ecdf]"
                    style={{ paddingTop: spacing, paddingBottom: spacing }}
                >
                    <p className="text-xs uppercase tracking-widest text-[#596451] font-semibold">
                        Operating Schedule
                    </p>
                    <h2 style={{ fontFamily: headingFont }} className="mt-3 text-3xl">
                        Hours of Operation
                    </h2>
                    <p className="mt-3 text-base font-medium text-[#304735]">
                        {project.sections_data.operating_hours}
                    </p>
                    <p className="mt-1 text-xs text-[#596451]">
                        Verified Business Schedule
                    </p>
                </section>
            )}

            {/* Contact & Location Section */}
            <section
                id="contact"
                className="px-8 text-center"
                style={{ paddingTop: spacing + 10, paddingBottom: spacing + 10 }}
            >
                <p className="text-xs uppercase tracking-widest text-[#596451] font-semibold">
                    Come Say Hello
                </p>
                <h2 style={{ fontFamily: headingFont }} className="mt-3 text-4xl">
                    We welcome your visit.
                </h2>
                <div className="mt-4 space-y-1 text-sm text-[#596451]">
                    <p className="font-medium">
                        {project.address ? `${project.address}, ` : ''}{project.city}
                    </p>
                    {project.phone && (
                        <p>Phone: {project.phone}</p>
                    )}
                </div>
                {project.phone && (
                    <div className="mt-6 flex justify-center gap-4">
                        <a
                            href={`tel:${project.phone.replace(/[^0-9+]/g, '')}`}
                            style={{ backgroundColor: color }}
                            className="inline-flex min-h-11 items-center gap-2 rounded px-6 text-xs font-semibold text-white shadow-sm"
                        >
                            Call our business
                        </a>
                    </div>
                )}
            </section>

            {/* Public Footer */}
            <footer
                style={{ backgroundColor: color }}
                className="flex flex-wrap items-center justify-between gap-4 px-8 py-8 text-xs text-white"
            >
                <span className="font-serif text-lg font-bold">{project.name}</span>
                <span className="text-stone-300">
                    © {new Date().getFullYear()} {project.name} · {project.city}
                </span>
            </footer>
        </div>
    );
}
