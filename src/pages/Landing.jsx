import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sliders, Download, Sparkles, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <Card
        hoverEffect
        className="p-8 flex flex-col items-center text-center space-y-4"
    >
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay, type: "spring" }}
            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_20px_rgba(127,0,255,0.3)]"
        >
            <Icon size={32} />
        </motion.div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </Card>
);

const WaveformBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 flex items-center justify-center gap-2">
        {[...Array(20)].map((_, i) => (
            <motion.div
                key={i}
                className="w-2 bg-gradient-to-t from-primary to-accent rounded-full"
                animate={{
                    height: ["20%", "80%", "30%", "100%", "40%"],
                }}
                transition={{
                    duration: 2 + (i % 3) * 0.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: (i % 5) * 0.2,
                }}
            />
        ))}
    </div>
);

export default function Landing() {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === 'true') {
            setIsAuthOpen(true);
            // Optionally remove the query parameter from URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar onOpenLogin={() => setIsAuthOpen(true)} />

            {/* Hero Section */}
            <main className="flex-1 flex flex-col relative">
                <WaveformBackground />

                <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-4">
                            <Sparkles size={16} />
                            <span>AI-Powered Audio Mastering</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
                            Your Elite Audio <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                                AI Workstation
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                            Professional AI Mastering and High-Fidelity Stem Separation. Choose your path below to get started.
                        </p>

                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button
                                size="lg"
                                onClick={() => navigate('/master')}
                                className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl h-auto hover:scale-105 transition-transform flex-col items-center gap-3 shadow-[0_0_30px_rgba(127,0,255,0.4)]"
                            >
                                <Sparkles size={32} />
                                <span>Master My Track</span>
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate('/split')}
                                className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl h-auto flex-col items-center gap-3 border-gray-600 text-gray-300 hover:text-white hover:border-white hover:bg-white/5 hover:scale-105 transition-all shadow-none"
                            >
                                <Sliders size={32} />
                                <span>Split My Stems</span>
                            </Button>
                        </div>
                    </motion.div>
                </section>

                {/* Features Section */}
                <section id="features" className="relative z-10 py-24 bg-black/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">About AudioMaster.AI</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">Your ultimate, all-in-one AI audio workstation built for musicians and producers.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <FeatureCard
                                icon={Sparkles}
                                title="Intelligent Mastering"
                                description="Automatically enhance your tracks with dynamic EQ, compression, and professional analog limiting."
                                delay={0.2}
                            />
                            <FeatureCard
                                icon={Sliders}
                                title="Precise Stem Separation"
                                description="Instantly isolate vocals, drums, bass, and instruments using our state-of-the-art Hybrid Transformer AI."
                                delay={0.4}
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Unlimited & Free"
                                description="Experience unrestricted studio-quality audio processing with completely free, uncompressed high-fidelity downloads."
                                delay={0.6}
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-dark py-12">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <span className="text-primary">⚡</span> AudioMaster.AI
                    </div>
                    <div className="flex gap-8">
                        <Link to="/about" className="hover:text-white transition-colors">About</Link>
                        <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                    <p>© 2026 AudioMaster.AI. All rights reserved.</p>
                </div>
            </footer>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
    );
}
