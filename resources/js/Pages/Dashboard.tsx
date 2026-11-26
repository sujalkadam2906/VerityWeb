import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icon';
import Badge from '@/Components/Badge';
import Thumbnail from '@/Components/Thumbnail';

interface Project {
    id: number;
    name: string;
    city: string;
    category: string;
    status: string;
    kind: string;
    updated: string;
}

interface DashboardProps {
    projects: Project[];
    metrics: {
        total: number;
        published: number;
        needsReview: number;
    };
}

export default function Dashboard({ projects = [], metrics }: DashboardProps) {
    const [filter, setFilter] = useState('All websites');
    const [query, setQuery] = useState('');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const filtered = projects.filter((p) => {
        const matchesFilter =
            filter === 'All websites' ||
            p.status.toLowerCase() === filter.toLowerCase() ||
            (filter === 'Needs review' && p.status === 'needs_review');
        const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.city.toLowerCase().includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
    });

    const duplicateProject = (id: number) => {
        setActiveMenu(null);
        router.post(route('projects.duplicate', id));
    };

    const deleteProject = (id: number) => {
        setActiveMenu(null);
        if (confirm('Are you sure you want to delete this project?')) {
            router.delete(route('projects.destroy', id));
        }
    };

    return (
        <AppLayout title="Your websites" breadcrumb="Overview" projectCount={metrics.total}>
            <Head title="Dashboard - Your websites" />

            {/* Page Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your websites</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Create, manage and publish your business websites.
                    </p>
                </div>
                <Link
                    href={route('projects.create')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    <Icon name="plus" className="h-4 w-4" />
                    Create website
                </Link>
            </div>

            {/* Metrics Bar */}
            <dl className="mb-9 grid grid-cols-3 border-y border-slate-200 py-5 bg-white/50 rounded-lg px-6">
                <div>
                    <dt className="text-sm font-medium text-slate-500">Total websites</dt>
                    <dd className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                        {metrics.total}
                    </dd>
                </div>
                <div className="border-l border-slate-200 pl-6 sm:pl-8">
                    <dt className="text-sm font-medium text-slate-500">Published</dt>
                    <dd className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-emerald-700">
                        {metrics.published}
                    </dd>
                </div>
                <div className="border-l border-slate-200 pl-6 sm:pl-8">
                    <dt className="text-sm font-medium text-slate-500">Needs review</dt>
                    <dd className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-amber-700">
                        {metrics.needsReview}
                    </dd>
                </div>
            </dl>

            {/* Filter Tabs and Search Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div
                    className="flex max-w-full gap-4 overflow-x-auto border-b border-slate-200 sm:gap-6"
                    role="tablist"
                    aria-label="Filter websites"
                >
                    {['All websites', 'Published', 'Draft', 'Needs review'].map((f) => (
                        <button
                            key={f}
                            role="tab"
                            aria-selected={filter === f}
                            onClick={() => setFilter(f)}
                            className={`min-h-11 shrink-0 border-b-2 text-sm transition-colors ${
                                filter === f
                                    ? 'border-indigo-600 font-semibold text-indigo-700'
                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm focus-within:ring-2 focus-within:ring-indigo-500">
                    <Icon name="search" className="h-4 w-4 text-slate-400" />
                    <input
                        aria-label="Search websites"
                        placeholder="Search websites…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-44 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Project Cards Grid */}
            {filtered.length > 0 ? (
                <div className="grid gap-6 xl:grid-cols-3 sm:max-md:grid-cols-2 lg:grid-cols-2">
                    {filtered.map((p) => (
                        <article
                            key={p.id}
                            className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow"
                        >
                            <div className="overflow-hidden rounded-t-lg border-b border-slate-200">
                                <Thumbnail kind={p.kind} />
                            </div>

                            <div className="p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-base font-semibold leading-6 tracking-tight text-slate-900">
                                            {p.name}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {p.category} · {p.city}
                                        </p>
                                    </div>

                                    {/* 3-dots Context Menu */}
                                    <div className="relative">
                                        <button
                                            aria-label={`Actions for ${p.name}`}
                                            onClick={() =>
                                                setActiveMenu(activeMenu === p.id ? null : p.id)
                                            }
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                        >
                                            <Icon name="more" className="h-4 w-4" />
                                        </button>

                                        {activeMenu === p.id && (
                                            <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                                <button
                                                    onClick={() => duplicateProject(p.id)}
                                                    className="flex min-h-9 w-full items-center px-3 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 rounded"
                                                >
                                                    Duplicate project
                                                </button>
                                                <button
                                                    onClick={() => deleteProject(p.id)}
                                                    className="flex min-h-9 w-full items-center px-3 text-left text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    Delete project
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                                    <Badge status={p.status} />
                                    <span className="text-xs text-slate-500">Updated {p.updated}</span>
                                </div>

                                <div className="mt-5 border-t border-slate-100 pt-4">
                                    <Link
                                        href={route('projects.create')}
                                        className="inline-flex min-h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        <span>
                                            {p.status === 'published'
                                                ? 'Continue editing'
                                                : p.status === 'needs_review'
                                                ? 'Review information'
                                                : 'Continue building'}
                                        </span>
                                        <Icon name="arrow" className="h-3.5 w-3.5 text-slate-400" />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Icon name="globe" className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        {query || filter !== 'All websites'
                            ? 'No matching websites found'
                            : 'Your first website starts with the information you already have.'}
                    </h2>
                    <p className="mx-auto my-3 max-w-md text-sm text-slate-600">
                        Share your business details, links or files. We’ll research, verify and build your
                        website with truth-first grounding.
                    </p>
                    <Link
                        href={route('projects.create')}
                        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Icon name="plus" className="h-4 w-4" />
                        Create your first website
                    </Link>
                </div>
            )}

            {/* Recent Activity Section */}
            <section className="mt-12 border-t border-slate-200 pt-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
                    <span className="text-xs text-slate-500">Live project updates</span>
                </div>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {[
                        {
                            icon: 'globe',
                            title: 'Project system initialized',
                            detail: 'Application database and workspace ready.',
                            time: 'Just now',
                        },
                    ].map((a) => (
                        <div key={a.title} className="flex items-start gap-4 p-4">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-indigo-600">
                                <Icon name={a.icon} className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1 sm:grid sm:grid-cols-2 sm:gap-4">
                                <p className="text-sm font-medium text-slate-900">{a.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500 sm:mt-0">{a.detail}</p>
                            </div>
                            <span className="shrink-0 text-xs text-slate-400">{a.time}</span>
                        </div>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
}
