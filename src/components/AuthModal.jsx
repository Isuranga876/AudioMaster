import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { supabase } from '../lib/supabaseClient';

export function AuthModal({ isOpen, onClose, initialView = 'login' }) {
    const [view, setView] = useState(initialView);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (view === 'signup') {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        }
                    }
                });
                if (signUpError) throw signUpError;
                // If we want auto-login, we could handle that, but typically Supabase sends a confirmation email.
                // Assuming email confirmation might be disabled for simplicity now:
                onClose();
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                onClose();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <Card
                    className="relative w-full max-w-md p-8 z-10 overflow-hidden"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    style={{ backgroundColor: '#1B1B2F' }}
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {view === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {view === 'login'
                                ? 'Enter your details to access your account'
                                : 'Sign up to start mastering your tracks'}
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}
                        
                        {view === 'signup' && (
                            <Input 
                                type="text" 
                                placeholder="Full Name" 
                                icon={UserIcon} 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        )}
                        <Input 
                            type="email" 
                            placeholder="Email Address" 
                            icon={Mail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input 
                            type="password" 
                            placeholder="Password" 
                            icon={Lock}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {view === 'login' && (
                            <div className="flex justify-end">
                                <a href="#" className="text-sm text-primary hover:text-purple-400 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        )}

                        <Button type="submit" className="w-full mt-2" size="md" disabled={loading}>
                            {loading ? 'Processing...' : (view === 'login' ? 'Log In' : 'Sign Up')}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-400">
                        {view === 'login' ? (
                            <p>
                                Don't have an account?{' '}
                                <button
                                    onClick={() => {
                                        setView('signup');
                                        setError(null);
                                    }}
                                    className="text-accent hover:text-rose-400 font-medium transition-colors"
                                >
                                    Sign up
                                </button>
                            </p>
                        ) : (
                            <p>
                                Already have an account?{' '}
                                <button
                                    onClick={() => {
                                        setView('login');
                                        setError(null);
                                    }}
                                    className="text-accent hover:text-rose-400 font-medium transition-colors"
                                >
                                    Log in
                                </button>
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </AnimatePresence>
    );
}
