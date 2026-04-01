import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Menu } from 'lucide-react';
import { Button } from './Button';

import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

export function Navbar({ onOpenLogin }) {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleHomeClick = (e) => {
        if (window.location.pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-dark/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" onClick={handleHomeClick} className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
                    <Headphones className="text-primary w-8 h-8" />
                    <span>AudioMaster<span className="text-accent">.AI</span></span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <Link to="/" onClick={handleHomeClick} className="hover:text-white transition-colors">Home</Link>
                    <a href="/#features" className="hover:text-white transition-colors">Features</a>
                    <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-white text-sm font-medium pr-4 border-r border-white/20">
                                {user.user_metadata?.full_name || user.email}
                            </span>
                            <Button variant="ghost" onClick={handleLogout}>Log out</Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={onOpenLogin}>Log in</Button>
                            <Button variant="primary" size="sm" onClick={onOpenLogin}>Get Started</Button>
                        </>
                    )}
                </div>

                <button 
                    className="md:hidden text-white p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-[#1B1B2F]/95 backdrop-blur-xl border-b border-white/10 p-4 slide-in-from-top-2 z-50 animate-in fade-in">
                    <div className="flex flex-col space-y-4">
                        <Link 
                            to="/" 
                            onClick={(e) => { handleHomeClick(e); setIsMenuOpen(false); }} 
                            className="text-white hover:text-primary transition-colors text-lg"
                        >
                            Home
                        </Link>
                        <a 
                            href="/#features" 
                            onClick={() => setIsMenuOpen(false)} 
                            className="text-white hover:text-primary transition-colors text-lg"
                        >
                            Features
                        </a>
                        <Link 
                            to="/dashboard" 
                            onClick={() => setIsMenuOpen(false)} 
                            className="text-white hover:text-primary transition-colors text-lg"
                        >
                            Dashboard
                        </Link>
                        <div className="w-full h-px bg-white/10 my-2" />
                        {user ? (
                            <div className="flex flex-col space-y-4">
                                <span className="text-gray-400 text-sm">
                                    Signed in as: <span className="text-white font-medium">{user.user_metadata?.full_name || user.email}</span>
                                </span>
                                <Button variant="ghost" className="w-full justify-start text-rose-500" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Log out</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-2">
                                <Button variant="ghost" className="w-full" onClick={() => { onOpenLogin(); setIsMenuOpen(false); }}>Log in</Button>
                                <Button variant="primary" className="w-full" onClick={() => { onOpenLogin(); setIsMenuOpen(false); }}>Get Started</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
