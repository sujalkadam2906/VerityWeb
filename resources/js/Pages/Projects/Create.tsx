import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icon';

export default function Create() {
    const [step, setStep] = useState(0);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        city: string;
        category: string;
        address: string;
        phone: string;
        description: string;
        links: string[];
        files: File[];
    }>({
        name: '',
        city: '',
        category: '',
        address: '',
        phone: '',
        description: '',
        links: ['', '', ''],
        files: [],
    });

    const updateLink = (index: number, value: string) => {
        const next = [...data.links];
        next[index] = value;
        setData('links', next);
    };

    const addLink = () => {
        setData('links', [...data.links, '']);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files).filter((f) =>
            /\.(pdf|jpe?g|png|webp)$/i.test(f.name)
        );
        setData('files', [...data.files, ...dropped]);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selected = Array.from(e.target.files);
        setData('files', [...data.files, ...selected]);
    };

    const removeFile = (index: number) => {
        setData('files', data.files.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.store'), { forceFormData: true });
    };

    const canContinue = () => {
        if (step === 0) return Boolean(data.name.trim() && data.city.trim());
        if (step === 1) {
            return !data.links.some((l) => l && !/^https?:\/\/.+\..+/.test(l));
        }
        return true;
    };

    return (
        <AppLayout title="Create website" breadcrumb="Create website">
            <Head title="Create your website - VerityWeb" />

            <div className="mx-auto max-w-3xl">
                {/* 4-Step Progress Stepper */}
                <div className="mb-8 grid grid-cols-4 border-b border-slate-200">
                    {['Business identity', 'Online presence', 'Upload files', 'Review'].map(
                        (label, i) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => i < step && setStep(i)}
                                disabled={i > step}
                                className={`flex min-h-16 flex-col items-center justify-center gap-1.5 border-b-2 pb-3 text-xs sm:text-sm font-medium transition-colors ${
                                    i <= step
                                        ? 'border-indigo-600 text-indigo-700'
                                        : 'border-transparent text-slate-400'
                                }`}
                            >
                                <span
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                        i < step
                                            ? 'bg-emerald-600 text-white'
                                            : i === step
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {i < step ? '✓' : i + 1}
                                </span>
                                <span>{label}</span>
                            </button>
                        )
                    )}
                </div>

                {/* Form Card */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                    <div className="mb-7">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                            Step {step + 1} of 4
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                            {[
                                'Tell us about your business',
                                'Where can we find you online?',
                                'Add your business files',
                                'Review your information',
                            ][step]}
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-500">
                            {[
                                'Start with the basics. We’ll use this to discover and ground your website.',
                                'Add links to your existing presence. You do not need to provide every field.',
                                'Menus, price lists, brochures, logos — anything with facts about your business.',
                                'Review the gathered information before we begin factual verification.',
                            ][step]}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Business Identity */}
                        {step === 0 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Business name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Bloom & Bean Café"
                                        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="e.g. Portland"
                                            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            required
                                        />
                                        {errors.city && (
                                            <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Category <span className="text-xs text-slate-400 font-normal">· Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            placeholder="e.g. Café & coffee shop"
                                            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Phone number <span className="text-xs text-slate-400 font-normal">· Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="e.g. (503) 555-0142"
                                            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Street address <span className="text-xs text-slate-400 font-normal">· Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="e.g. 124 Maple Street"
                                            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Short description <span className="text-xs text-slate-400 font-normal">· Optional</span>
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="What makes your business special? What do you offer?"
                                        rows={3}
                                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Online Presence */}
                        {step === 1 && (
                            <div className="space-y-5">
                                {data.links.map((link, idx) => {
                                    const labels = [
                                        'Existing website',
                                        'Google Business profile URL',
                                        'Instagram profile URL',
                                    ];
                                    const label = labels[idx] || `Source URL ${idx + 1}`;
                                    const isInvalid =
                                        link && !/^https?:\/\/.+\..+/.test(link);

                                    return (
                                        <div key={idx}>
                                            <label className="block text-sm font-medium text-slate-700">
                                                {label} <span className="text-xs text-slate-400 font-normal">· Optional</span>
                                            </label>
                                            <div className="mt-2 flex items-center gap-2">
                                                <input
                                                    type="url"
                                                    value={link}
                                                    onChange={(e) => updateLink(idx, e.target.value)}
                                                    placeholder="https://"
                                                    className={`min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                                        isInvalid
                                                            ? 'border-red-300 ring-1 ring-red-300'
                                                            : 'border-slate-200'
                                                    }`}
                                                />
                                            </div>
                                            {isInvalid && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    Please enter a valid URL starting with https://
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={addLink}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    <Icon name="plus" className="h-4 w-4" />
                                    Add another source link
                                </button>
                            </div>
                        )}

                        {/* Step 3: Upload Business Files */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
                                    <strong>Evidence Ingestion:</strong> Documents uploaded here are securely processed by VerityWeb's Evidence Engine. Text-based PDFs and business menus are extracted to ground your business facts.
                                </div>

                                <label
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleFileDrop}
                                    className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center transition-colors hover:bg-indigo-50/70"
                                >
                                    <Icon name="upload" className="mb-3 h-8 w-8 text-indigo-600" />
                                    <span className="text-sm font-medium text-slate-900">
                                        Drop your business files here, or{' '}
                                        <span className="text-indigo-600 underline">browse files</span>
                                    </span>
                                    <span className="mt-1.5 text-xs text-slate-500">
                                        Supports PDF, JPG, PNG, or WebP (Menus, price lists, brochures)
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        className="sr-only"
                                        onChange={handleFileInput}
                                    />
                                </label>

                                {data.files.length === 0 ? (
                                    <p className="text-center text-xs text-slate-500">
                                        No files attached yet. You can also skip this and add them later.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                                        {data.files.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3.5"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Icon name="file" className="h-5 w-5 text-indigo-600 shrink-0" />
                                                    <div className="truncate">
                                                        <p className="truncate text-sm font-medium text-slate-800">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {(file.size / 1024).toFixed(0)} KB · Ready to upload & extract
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Review Information */}
                        {step === 3 && (
                            <div className="space-y-4">
                                {[
                                    {
                                        title: 'Business identity',
                                        stepIndex: 0,
                                        items: [
                                            { label: 'Name', val: data.name },
                                            { label: 'City', val: data.city },
                                            { label: 'Category', val: data.category || 'Not specified' },
                                            { label: 'Address', val: data.address || 'Not specified' },
                                            { label: 'Phone', val: data.phone || 'Not specified' },
                                        ],
                                    },
                                    {
                                        title: 'Online sources',
                                        stepIndex: 1,
                                        summary:
                                            data.links.filter(Boolean).join(', ') ||
                                            'No online links provided',
                                    },
                                    {
                                        title: 'Business files',
                                        stepIndex: 2,
                                        summary:
                                            data.files.map((f: File) => f.name).join(', ') ||
                                            'No documents uploaded',
                                    },
                                ].map((sec) => (
                                    <div
                                        key={sec.title}
                                        className="rounded-lg border border-slate-200 p-4 bg-white"
                                    >
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {sec.title}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setStep(sec.stepIndex)}
                                                className="text-xs font-medium text-indigo-600 hover:underline"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        {sec.items ? (
                                            <dl className="grid gap-2 text-xs sm:grid-cols-2">
                                                {sec.items.map((it) => (
                                                    <div key={it.label}>
                                                        <dt className="text-slate-400">{it.label}</dt>
                                                        <dd className="font-medium text-slate-800">
                                                            {it.val}
                                                        </dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        ) : (
                                            <p className="text-xs text-slate-600">{sec.summary}</p>
                                        )}
                                    </div>
                                ))}

                                <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-4">
                                    <p className="text-xs leading-5 text-indigo-900 font-medium">
                                        🛡️ Truth-First Guarantee: We will only extract and verify factual information from these sources. No details will be invented.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                            <button
                                type="button"
                                onClick={() => (step > 0 ? setStep(step - 1) : window.history.back())}
                                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Back
                            </button>

                            {step < 3 ? (
                                <button
                                    type="button"
                                    disabled={!canContinue()}
                                    onClick={() => setStep(step + 1)}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                    <Icon name="arrow" className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing ? 'Saving & Analyzing…' : 'Start Research & Verification'}
                                    <Icon name="arrow" className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
