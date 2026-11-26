import React, { PropsWithChildren, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';

interface AppLayoutProps {
    title?: string;
    breadcrumb?: string;
    projectCount?: number;
}

export default function AppLayout({
    children,
    title = 'Overview',
    breadcrumb = 'Overview',
    projectCount = 0,
}: PropsWithChildren<AppLayoutProps>) {
    const { auth } = usePage().props as any;
    const user = auth?.user || { name: 'User', email: 'user@example.com' };

    const navItems = [
        { name: 'Overview', href: route('dashboard'), icon: 'grid', active: route().current('dashboard') },
        { name: 'Create Website', href: route('projects.create'), icon: 'plus', active: route().current('projects.create') },
    ];

    return (
        <div className="min-h-screen bg-[#f7f8fa] font-sans text-[#172033]">
            {/* Desktop Left Sidebar (w-60 / 240px) */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
                <Link
                    href={route('dashboard')}
                    className="flex min-h-20 items-center gap-2.5 px-6 text-xl font-semibold tracking-tight text-slate-900"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                        <Icon name="shield" className="h-5 w-5" />
                    </span>
                    VerityWeb
                </Link>

                <div className="mx-5 mb-6 flex items-center gap-3 border-b border-slate-200 py-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 text-sm font-medium">
                        <span className="block truncate">{user.name}’s space</span>
                        <p className="text-xs font-normal text-slate-500">Personal workspace</p>
                    </div>
                </div>

                <div className="px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Workspace
                </div>

                <nav aria-label="Workspace navigation" className="mt-3 space-y-1 px-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                                item.active
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <Icon name={item.icon} className="h-4 w-4" />
                            {item.name}
                            {item.name === 'Overview' && projectCount > 0 && (
                                <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                                    {projectCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="mb-4 mt-auto space-y-1 px-3 pt-6 border-t border-slate-100">
                    <Link
                        href={route('profile.edit')}
                        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        <Icon name="settings" className="h-4 w-4" />
                        Settings
                    </Link>
                </div>

                <div className="flex min-h-20 items-center gap-3 border-t border-slate-200 px-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                        {user.name.substring(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-xs text-slate-500 hover:text-red-600 font-medium"
                        title="Sign Out"
                    >
                        Log out
                    </Link>
                </div>
            </aside>

            {/* Mobile Horizontal Navigation Bar (<768px) */}
            <nav
                aria-label="Mobile workspace navigation"
                className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 md:hidden"
            >
                <Link
                    href={route('dashboard')}
                    className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white"
                >
                    <Icon name="shield" className="h-5 w-5" />
                </Link>
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`min-h-14 shrink-0 border-b-2 px-3 text-xs font-medium inline-flex items-center ${
                            item.active
                                ? 'border-indigo-600 text-indigo-700 font-semibold'
                                : 'border-transparent text-slate-600'
                        }`}
                    >
                        {item.name}
                    </Link>
                ))}
                <Link
                    href={route('profile.edit')}
                    className="min-h-14 shrink-0 px-3 text-xs text-slate-600 inline-flex items-center"
                >
                    Settings
                </Link>
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="min-h-14 shrink-0 px-3 text-xs text-red-600 font-medium inline-flex items-center ml-auto"
                >
                    Log out
                </Link>
            </nav>

            {/* Main Application Container */}
            <div className="md:ml-60">
                {/* Header Bar (h-20 / 80px) */}
                <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-10">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="md:hidden font-semibold text-indigo-700">VerityWeb /</span>
                        <span>Workspace</span>
                        <span className="mx-1 text-slate-300">/</span>
                        <span className="font-medium text-slate-800">{breadcrumb}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-600 sm:flex">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active workspace
                        </span>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
