import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, User, Settings, LogOut, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: UploadCloud, label: 'Master', path: '/master' },
    { icon: SplitSquareHorizontal, label: 'Splitter', path: '/split' },
    { icon: User, label: 'Profile', path: '/dashboard#profile' },
];

export function Sidebar() {
    const location = useLocation();
    const { user } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="w-64 h-screen border-r border-white/5 bg-[#1B1B2F]/80 backdrop-blur-md flex-col p-4 fixed left-0 top-0 hidden md:flex z-40">
                <div className="px-4 py-6 mb-4">
                    <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
                        <span className="text-primary text-2xl">⚡</span>
                        <span>AudioMaster</span>
                    </Link>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-primary/20 text-primary"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-white")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-2">
                    
                    {user && (
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Log Out
                        </button>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1B1B2F]/95 backdrop-blur-md border-t border-white/10 flex justify-around items-center p-2 z-50 pb-safe">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 min-w-[64px] rounded-xl transition-all",
                                isActive ? "text-primary" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6 mb-1", isActive ? "scale-110" : "")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
