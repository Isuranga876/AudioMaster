import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Play, Pause, Download, Settings2, Sparkles, Check, Music, ArrowLeft } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

const THEMES = [
    { id: 'fire', name: 'Fire / Bass Boosted', color: 'from-orange-500 to-red-500' },
    { id: 'neutral', name: 'Natural / Clean', color: 'from-gray-400 to-gray-600' },
    { id: 'ethereal', name: 'Magical / Ethereal', color: 'from-purple-500 to-pink-500' },
    { id: 'vibrant', name: 'Vibrant / Bright', color: 'from-blue-400 to-cyan-400' },
];

export default function MasterPage() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // States: 'idle' -> 'uploaded' -> 'mastering' -> 'done'
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0].id);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAfter, setIsAfter] = useState(false);
    const [fileId, setFileId] = useState(null);
    const savedTimeRef = useRef(0);
    const shouldPlayRef = useRef(false);
    const wavesurferRef = useRef(null);
    const currentUrlRef = useRef(null);

    // We use a callback ref to safely instantiate WaveSurfer when the DOM node is ready
    const handleContainerRef = useCallback((node) => {
        if (!node) {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
            return;
        }

        if (wavesurferRef.current) return;

        wavesurferRef.current = WaveSurfer.create({
            container: node,
            waveColor: '#4b5563', // gray-600
            progressColor: '#FF4D6D', // Default, will change
            cursorColor: '#ffffff',
            barWidth: 3,
            barRadius: 3,
            cursorWidth: 1,
            height: 100,
            normalize: true,
        });

        const ws = wavesurferRef.current;

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));
            
        ws.on('ready', () => {
            const duration = ws.getDuration();
            if (savedTimeRef.current > 0 && savedTimeRef.current < duration) {
                ws.setTime(savedTimeRef.current);
            }
            if (shouldPlayRef.current) {
                ws.play();
                shouldPlayRef.current = false;
            }
        });
    }, []);

    // Handle Browser Back Button explicitly
    useEffect(() => {
        const handlePopState = () => {
            localStorage.removeItem('activeMasterTrackId');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Auto-load track and support history state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlTrackId = params.get('trackId');
        const trackId = urlTrackId || localStorage.getItem('activeMasterTrackId');
        
        if (trackId) {
            // Restore from localStorage if they just loaded /master
            if (!urlTrackId) {
                navigate(`/master?trackId=${trackId}`, { replace: true });
                return;
            }
            if (fileId !== trackId) {
                setFileId(trackId);
                setStatus('done');
                setIsAfter(true);
            }
        } else {
            // Always ensure UI resets to upload when URL has no trackId
            setStatus('idle');
            setFile(null);
            setFileId(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // 2. Load audio and update options when status/theme changes
    useEffect(() => {
        if (!wavesurferRef.current) return;

        const ws = wavesurferRef.current;

        // Update progress color based on isAfter
        ws.setOptions({
            progressColor: isAfter ? '#7F00FF' : '#FF4D6D',
        });

        // Determine correct URL
        let newUrl = null;
        if (status === 'done' && fileId) {
            newUrl = `http://localhost:8000/stream/${fileId}?theme=${!isAfter ? 'original' : selectedTheme}`;
        } else if (file && status === 'uploaded') {
            newUrl = URL.createObjectURL(file);
        }

        // Only load if URL changes to prevent reloading loop
        if (newUrl && currentUrlRef.current !== newUrl) {
            currentUrlRef.current = newUrl;
            ws.load(newUrl);
        }
    }, [status, file, isAfter, fileId, selectedTheme]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setStatus('uploaded');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setStatus('uploaded');
        }
    };

    const applyMaster = async () => {
        setStatus('mastering');
        setProgress(30);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user ? user.id : 'demo-user');

            const response = await fetch('http://localhost:8000/master', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Mastering failed on server');

            const data = await response.json();
            setProgress(100);
            
            setTimeout(() => {
                setFileId(data.file_id);
                localStorage.setItem('activeMasterTrackId', data.file_id);
                setStatus('done');
                setIsAfter(true);
                navigate(`/master?trackId=${data.file_id}`);
            }, 500);

        } catch (error) {
            console.error('Mastering error:', error);
            alert('Failed to contact backend. Is the Python server running on port 8000?');
            setStatus('uploaded');
            setProgress(0);
        }
    };

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    return (
        <div className={cn("flex min-h-screen bg-dark", status === 'done' ? "pb-32" : "")}>
            <Sidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-full overflow-hidden flex flex-col pt-20 md:pt-8 min-h-screen pb-24">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                            <Sparkles className="text-primary" /> Master Your Track
                        </h1>
                        <p className="text-gray-400">Upload your mix, select a theme, and let AI do the rest.</p>
                    </div>
                    {status !== 'idle' && (
                        <Button 
                            variant="ghost" 
                            className="bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 shrink-0 px-4"
                            onClick={() => {
                                localStorage.removeItem('activeMasterTrackId');
                                setStatus('idle');
                                setFile(null);
                                setFileId(null);
                                navigate('/master', { replace: true });
                            }}
                        >
                            <ArrowLeft className="mr-2" size={18} />
                            Back
                        </Button>
                    )}
                </header>

                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div 
                            key="idle"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "w-full max-w-5xl mx-auto flex-1 max-h-[500px] flex flex-col items-center justify-center border-2 border-dashed rounded-[40px] p-8 md:p-12 text-center transition-all group relative cursor-pointer mt-4",
                                isDragging ? "border-primary bg-primary/5 shadow-[0_0_50px_rgba(127,0,255,0.2)]" : "border-white/10 bg-black/20 hover:border-primary/40"
                            )}
                        >
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                             <div className={cn(
                                 "w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all shadow-[0_0_30px_rgba(127,0,255,0.2)]",
                                 isDragging ? "scale-110 bg-primary/20 text-primary" : "bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/20"
                             )}>
                                 <UploadCloud size={40} />
                             </div>
                             <h2 className="text-2xl font-bold text-white mb-2">Drag & Drop Audio</h2>
                             <p className="text-gray-400 max-w-md mx-auto mb-8">or click to browse files (WAV, MP3, FLAC)</p>
                             <Button size="lg" className="bg-primary hover:bg-primary/80 border-0 hover:shadow-[0_0_20px_rgba(127,0,255,0.5)] relative z-0 pointer-events-none text-white">
                                 Select File
                             </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {status !== 'idle' && (
                    <div className="space-y-8">
                        <Card className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white">
                                        <Music size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{file?.name || 'Mastered Audio'}</h3>
                                        <p className="text-sm text-gray-400">{file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Processed permanently in library'}</p>
                                    </div>
                                </div>

                                {status === 'done' && (
                                    <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
                                        <button
                                            onClick={() => {
                                                if (wavesurferRef.current) {
                                                    savedTimeRef.current = wavesurferRef.current.getCurrentTime();
                                                    shouldPlayRef.current = true;
                                                }
                                                setIsAfter(false);
                                            }}
                                            className={cn(
                                                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                                                !isAfter ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            Original
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (wavesurferRef.current) {
                                                    savedTimeRef.current = wavesurferRef.current.getCurrentTime();
                                                    shouldPlayRef.current = true;
                                                }
                                                setIsAfter(true);
                                            }}
                                            className={cn(
                                                "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                                isAfter ? "bg-primary text-white shadow-[0_0_15px_rgba(127,0,255,0.4)]" : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            <Sparkles size={14} /> Mastered
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Waveform Player */}
                            {status !== 'mastering' && (
                                <div className="bg-black/30 rounded-2xl p-6 mb-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <button
                                            onClick={togglePlay}
                                            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_15px_rgba(127,0,255,0.4)] hover:scale-105 transition-transform shrink-0"
                                        >
                                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                                        </button>
                                        <div className="flex-1 min-w-0" ref={handleContainerRef} />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons & Progress */}
                            {status === 'uploaded' && (
                                <div className="flex justify-end">
                                    <Button size="lg" onClick={applyMaster} className="group">
                                        <Sparkles className="mr-2 group-hover:animate-pulse" size={20} />
                                        Master Track Now
                                    </Button>
                                </div>
                            )}

                            {status === 'mastering' && (
                                <motion.div 
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                        {/* Rotating rings */}
                                        <div className="absolute inset-0 border-4 border-white/5 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(127,0,255,0.3)]"></div>
                                        <div className="absolute inset-4 border-4 border-white/5 border-b-accent rounded-full animate-spin animation-delay-150"></div>
                                        <Sparkles size={32} className="text-white animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">AI is Mastering your track...</h3>
                                    <p className="text-gray-400 mb-8">Applying advanced compression, dynamic EQ, and limiting.</p>
                                    
                                    <div className="w-full max-w-md h-3 bg-white/5 rounded-full overflow-hidden mx-auto">
                                        <motion.div 
                                            className={cn("h-full bg-gradient-to-r", THEMES.find(t => t.id === selectedTheme)?.color || "from-primary to-accent")}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ ease: "linear" }}
                                        />
                                    </div>
                                    <p className="text-primary font-mono text-sm mt-3">{progress}% complete</p>
                                </motion.div>
                            )}

                            {status === 'done' && (
                                <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-3 text-green-400">
                                        <Check size={24} />
                                        <span className="font-medium">Mastering complete! Check the preview above.</span>
                                    </div>
                                    <Button 
                                        variant="accent"
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = `http://localhost:8000/download/${fileId}?theme=${selectedTheme}`;
                                            a.download = `${file.name.split('.')[0]}_${selectedTheme}.mp3`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                        }}
                                    >
                                        <Download className="mr-2" size={20} />
                                        Download File
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* Themes Carousel */}
                        {status === 'done' && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Select Mastering Theme</h3>
                                        <p className="text-sm text-gray-400">Click to instantly preview.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        localStorage.removeItem('activeMasterTrackId');
                                        setStatus('idle');
                                        setFile(null);
                                        setFileId(null);
                                    }}>
                                        Start New Track
                                    </Button>
                                </div>

                                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                    {THEMES.map(theme => {
                                        const isSelected = selectedTheme === theme.id;
                                        return (
                                            <Card
                                                key={theme.id}
                                                hoverEffect
                                                onClick={() => {
                                                    if (wavesurferRef.current) {
                                                        savedTimeRef.current = wavesurferRef.current.getCurrentTime();
                                                        shouldPlayRef.current = true;
                                                    }
                                                    setSelectedTheme(theme.id);
                                                    if (!isAfter) setIsAfter(true); // Force after view
                                                }}
                                                className={cn(
                                                    "min-w-[200px] shrink-0 p-5 cursor-pointer snap-start transition-all border-2",
                                                    isSelected ? "border-primary bg-primary/20 shadow-[0_0_15px_rgba(127,0,255,0.3)]" : "border-transparent bg-black/40 hover:bg-white/5"
                                                )}
                                            >
                                                <div className={cn("w-12 h-12 rounded-xl mb-4 bg-gradient-to-br", theme.color)} />
                                                <h4 className="font-bold text-white mb-1">{theme.name}</h4>
                                                <p className="text-xs text-gray-400 mb-4">Tailored EQ and dynamics.</p>

                                                {isSelected && (
                                                    <div className="text-primary text-sm font-medium flex items-center gap-1">
                                                        <Check size={16} /> Selected
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
