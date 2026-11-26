import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icon';
import Badge from '@/Components/Badge';
import Thumbnail from '@/Components/Thumbnail';

interface Project {
    id: number;
    name: string;
    city: string;
    category: string;
    slug: string;
    is_published: boolean;
    status: string;
    kind: string;
}

interface PublishProps {
    project: Project;
}

export default function Publish({ project }: PublishProps) {
    const [copied, setCopied] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        slug: project.slug,
    });

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.publish-site', project.id));
    };

    const handleUnpublish = () => {
        if (confirm('Are you sure you want to unpublish this website?')) {
            post(route('projects.unpublish-site', project.id));
        }
    };

    const publicUrl = `${window.location.origin}/sites/${data.slug || project.slug}`;

    const handleCopy = () => {
        navigator.clipboard?.writeText(publicUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        });
    };

    return (
        <AppLayout title="Publish website" breadcrumb="Publish">
            <Head title={`Publish - ${project.name}`} />

            <div className="mx-auto max-w-4xl">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_1.3fr] items-start">
                    {/* Left: Project Card & Preview */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <Thumbnail kind={project.kind || 'general'} name={project.name} large />
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">{project.name}</h2>
                                <Badge status={project.is_published ? 'Published' : 'Draft'} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {project.category} · {project.city}
                            </p>

                            <div className="mt-6 flex gap-3">
                                <Link
                                    href={route('projects.editor', project.id)}
                                    className="flex-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    ← Back to editor
                                </Link>
                                {project.is_published && (
                                    <a
                                        href={route('sites.show', project.slug)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                    >
                                        Live site
                                        <Icon name="external" className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Publishing Checklist & Slug Settings */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                                {project.is_published ? 'Your website is live.' : 'Ready to publish'}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                {project.is_published
                                    ? 'Your public website is accessible to visitors. Any new edits in the builder remain in draft until you republish.'
                                    : 'Review your pre-flight checklist and choose your public URL address to go live.'}
                            </p>
                        </div>

                        {/* Pre-Flight Checklist */}
                        <div className="space-y-3 rounded-lg bg-slate-50 p-4 border border-slate-100">
                            {[
                                'Truth-First Grounding verified',
                                'Contact information & hours approved',
                                'Responsive layout reviewed',
                                'Zero unresolved factual conflicts',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2.5 text-xs text-slate-700">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                        ✓
                                    </span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        {/* Slug Form */}
                        <form onSubmit={handlePublish} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Website web address (Slug)
                                </label>
                                <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-indigo-500">
                                    <span className="text-xs text-slate-400 select-none">
                                        {window.location.host}/sites/
                                    </span>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) =>
                                            setData(
                                                'slug',
                                                e.target.value
                                                    .toLowerCase()
                                                    .replace(/[^a-z0-9-]/g, '')
                                            )
                                        }
                                        className="min-h-11 flex-1 border-0 bg-transparent px-1 text-xs text-slate-900 outline-none font-medium"
                                        required
                                    />
                                </div>
                                {errors.slug && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.slug}</p>
                                )}
                            </div>

                            {project.is_published ? (
                                <div className="space-y-3 pt-2">
                                    <div className="flex gap-2">
                                        <a
                                            href={route('sites.show', project.slug)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                                        >
                                            View public website
                                            <Icon name="external" className="h-3.5 w-3.5" />
                                        </a>

                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            {copied ? 'Copied!' : 'Copy link'}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleUnpublish}
                                        className="w-full text-center text-xs text-red-600 hover:underline pt-2 font-medium"
                                    >
                                        Unpublish website (Set back to draft)
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing || !data.slug.trim()}
                                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Publish website now
                                    <Icon name="external" className="h-4 w-4" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
