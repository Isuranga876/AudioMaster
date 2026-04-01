import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Sidebar } from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Play, Pause, Download, Sliders, Volume2, VolumeX, Mic, Speaker, Music, Drum, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import WaveSurfer from 'wavesurfer.js';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';

// Define the stem types for the UI
const STEM_TYPES = [
    { id: 'vocals', name: 'Vocals', icon: Mic, color: '#FF4D6D' },
    { id: 'drums', name: 'Drums', icon: Drum, color: '#4DFF88' },
    { id: 'bass', name: 'Bass', icon: Speaker, color: '#4D9BFF' },
    { id: 'other', name: 'Other', icon: Music, color: '#FFD166' }
];

// Mock stems for development of the frontend
const MOCK_STEMS = STEM_TYPES.map(type => ({
    ...type,
    // Provide a dummy audio file URL for testing visuals (can be any short sound, or just empty space)
    url: 'https://freesound.org/data/previews/333/333895_609787-lq.mp3'
}));

function StemTrack({ stem, isPlaying, masterTime, onPlay, onSeek, globalTranspose }) {
    const containerRef = useRef(null);
    const wavesurferRef = useRef(null);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [pitchShiftNode, setPitchShiftNode] = useState(null);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current) return;

        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = stem.url;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            media: audio,
            waveColor: stem.color + '40', // 40 is hex alpha (25%)
            progressColor: stem.color,
            cursorColor: '#ffffff',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 60,
            normalize: true,
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
            setIsLoaded(true);
            try {
                const ctx = Tone.getContext().rawContext;
                const source = ctx.createMediaElementSource(audio);
                const shift = new Tone.PitchShift({
                    pitch: globalTranspose,
                    windowSize: 0.1,
                    delayTime: 0,
                    feedback: 0
                }).toDestination();
                
                Tone.connect(source, shift);
                setPitchShiftNode(shift);
            } catch (err) {
                console.warn("Tone.js Web Audio connection issue", err);
            }
        });

        // Broadcast seek events to sync other tracks
        ws.on('interaction', () => {
            if (onSeek) onSeek(ws.getCurrentTime());
        });

        return () => {
            ws.destroy();
            wavesurferRef.current = null;
            setIsLoaded(false);
        };
    }, [stem.url, stem.color]);

    // Handle Play/Pause Sync natively
    useEffect(() => {
        if (!wavesurferRef.current || !isLoaded) return;
        if (isPlaying && !wavesurferRef.current.isPlaying()) {
            wavesurferRef.current.play();
        } else if (!isPlaying && wavesurferRef.current.isPlaying()) {
            wavesurferRef.current.pause();
        }
    }, [isPlaying, isLoaded]);

    // Handle external seeks (from other tracks or master)
    useEffect(() => {
        if (!wavesurferRef.current || !isLoaded || masterTime === null) return;
        // Prevent feedback loop: only seek if difference is large
        if (Math.abs(wavesurferRef.current.getCurrentTime() - masterTime) > 0.1) {
            wavesurferRef.current.setTime(masterTime);
        }
    }, [masterTime, isLoaded]);

    // Handle Volume and Mute
    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(isMuted ? 0 : volume);
        }
    }, [volume, isMuted]);

    // Handle Transpose
    useEffect(() => {
        if (pitchShiftNode) {
            pitchShiftNode.pitch = globalTranspose;
        }
    }, [globalTranspose, pitchShiftNode]);

    return (
        <Card className="flex flex-col md:flex-row items-center gap-4 p-4 border border-white/5 bg-black/40 relative group">
            <div className="flex items-center gap-4 w-full md:w-48 shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: stem.color + '20', color: stem.color }}>
                    <stem.icon size={20} />
                </div>
                <div>
                    <h4 className="text-white font-medium text-sm">{stem.name}</h4>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-32 shrink-0">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${isMuted ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    M
                </button>
                <div className="group flex items-center flex-1 relative h-8">
                    {isMuted ? <VolumeX size={14} className="text-gray-500 shrink-0" /> : <Volume2 size={14} className="text-gray-400 shrink-0" />}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 ml-2 accent-primary bg-white/10 rounded-full appearance-none flex-1"
                    />
                </div>
            </div>

            <div ref={containerRef} className="flex-1 w-full min-w-0 bg-black/20 rounded-lg overflow-hidden" />

            <Button variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-white" onClick={() => window.open(stem.url)}>
                <Download size={18} />
            </Button>
        </Card>
    );
}

export default function SplitterPage() {
    const { user } = useAuth();
    const [state, setState] = useState('upload'); // 'upload', 'choose_stems', 'processing', 'mixer'
    const [progress, setProgress] = useState(0);
    const [stems, setStems] = useState([]);
    const [file, setFile] = useState(null);
    const [fileId, setFileId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [trackInfo, setTrackInfo] = useState({ name: '', bpm: '', key: '' });
    const [strictVocals, setStrictVocals] = useState(false);

    // Global Transport State
    const [isPlaying, setIsPlaying] = useState(false);
    const [masterTime, setMasterTime] = useState(null);
    const [transpose, setTranspose] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (isPlaying) {
            Tone.start().catch(console.error);
        }
    }, [isPlaying]);

    // Handle Browser Back Button explicitly
    useEffect(() => {
        const handlePopState = () => {
            localStorage.removeItem('activeSplitTrackId');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Auto-load track and support history state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlTrackId = params.get('trackId');
        const trackId = urlTrackId || localStorage.getItem('activeSplitTrackId');

        if (trackId) {
            if (!urlTrackId) {
                navigate(`/split?trackId=${trackId}`, { replace: true });
                return;
            }
            if (fileId !== trackId) {
                setFileId(trackId);
                setState('processing');
                setProgress(50);
                pollStatus(trackId);
            }
        } else {
            // Always ensure UI resets to upload when URL has no trackId
            setState('upload');
            setFileId(null);
            setStems([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const handleFile = async (selectedFile) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setState('choose_stems');
    };

    const processFile = async (numStems) => {
        if (!file) return;
        setState('processing');
        setProgress(5);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user ? user.id : 'demo-user');
            formData.append('num_stems', numStems);
            formData.append('vocal_sensitivity', strictVocals ? 'high' : 'normal');

            const response = await fetch('http://localhost:8000/split', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Split failed on server');

            const data = await response.json();
            setFileId(data.file_id);
            localStorage.setItem('activeSplitTrackId', data.file_id);
            navigate(`/split?trackId=${data.file_id}`);
            pollStatus(data.file_id);
        } catch (error) {
            console.error('Split error:', error);
            alert('Failed to contact backend. Is the Python server running?');
            setState('upload');
            setProgress(0);
        }
    };

    const pollStatus = (id) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:8000/track/${id}`);
                const trackData = await res.json();
                
                if (trackData.original_name) {
                    setTrackInfo(prev => ({ 
                        ...prev, 
                        name: trackData.original_name,
                        bpm: trackData.stems?.bpm || trackData.bpm || prev.bpm,
                        key: trackData.stems?.key || trackData.key || prev.key
                    }));
                }

                setProgress(p => Math.min(p + 5, 95)); // Simulate progress

                if (trackData.split_status === 'completed') {
                    clearInterval(interval);
                    setProgress(100);

                    const backendStems = trackData.stems || {};
                    const newStems = STEM_TYPES.filter(type => backendStems[type.id]).map(type => {
                        let stemUrl = backendStems[type.id] || type.url;
                        // Fix local URLs to point to the backend server instead of frontend server
                        if (stemUrl.startsWith('/stems')) {
                            stemUrl = `http://localhost:8000${stemUrl}`;
                        }
                        return {
                            ...type,
                            url: stemUrl
                        };
                    });

                    setStems(newStems);
                    setState('mixer');
                } else if (trackData.split_status === 'error') {
                    clearInterval(interval);
                    alert("Stem separation failed on the backend.");
                    setState('upload');
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000); // Check every 3 seconds
    };

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
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };

    const handleSyncSeek = useCallback((time) => {
        setMasterTime(time);
    }, []);

    const handleDownloadAll = () => {
        if (fileId) {
            window.location.href = `http://localhost:8000/download-all-stems/${fileId}`;
        }
    };

    return (
        <div className={cn("flex min-h-screen bg-dark", state === 'mixer' ? "pb-32" : "")}>
            <Sidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-full overflow-hidden flex flex-col pt-20 md:pt-8 min-h-screen pb-24">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                            <Sliders className="text-accent" /> AI Stem Separation
                        </h1>
                        <p className="text-gray-400">Isolate vocals, drums, bass, and instruments instantly using advanced Hybrid Transformers.</p>
                    </div>
                    {state !== 'upload' && (
                        <Button
                            variant="ghost"
                            className="bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 shrink-0 px-4 mx-auto md:mx-0"
                            onClick={() => {
                                localStorage.removeItem('activeSplitTrackId');
                                setState('upload');
                                setFileId(null);
                                setStems([]);
                                navigate('/split', { replace: true });
                            }}
                        >
                            <ArrowLeft className="mr-2" size={18} />
                            Back
                        </Button>
                    )}
                </header>

                <AnimatePresence mode="wait">
                    {state === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "w-full max-w-5xl mx-auto flex-1 max-h-[500px] flex flex-col items-center justify-center border-2 border-dashed rounded-[40px] p-8 md:p-12 text-center transition-all group relative cursor-pointer mt-4",
                                isDragging ? "border-accent bg-accent/5 shadow-[0_0_50px_rgba(255,77,109,0.2)]" : "border-white/10 bg-black/20 hover:border-accent/40"
                            )}
                        >
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all shadow-[0_0_30px_rgba(255,77,109,0.2)]",
                                isDragging ? "scale-110 bg-accent/20 text-accent" : "bg-accent/10 text-accent group-hover:scale-110 group-hover:bg-accent/20"
                            )}>
                                <UploadCloud size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Upload Track to Split</h2>
                            <p className="text-gray-400 max-w-md mx-auto mb-8">Drop your mixed audio file here. We will instantly isolate it into 4 high-fidelity stems.</p>
                            <Button size="lg" className="bg-accent hover:shadow-[0_0_20px_rgba(255,77,109,0.5)] relative z-0 pointer-events-none">
                                Select File
                            </Button>
                        </motion.div>
                    )}

                    {state === 'choose_stems' && (
                        <motion.div
                            key="choose"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-8 md:p-12 text-center"
                        >
                            <h2 className="text-3xl font-bold text-white mb-4">Choose Extraction Type</h2>
                            <p className="text-gray-400 mb-8">Select how you want to split the track "{file?.name}".</p>
                            
                            <div className="flex items-center justify-center gap-3 w-full mb-8">
                                <span className="text-gray-400 text-sm">Vocal Sensitivity:</span>
                                <button 
                                    onClick={() => setStrictVocals(!strictVocals)}
                                    className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all border", 
                                        strictVocals ? "bg-accent/20 border-accent/50 text-accent" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                    )}
                                >
                                    {strictVocals ? "High Quality (Slower)" : "Standard/Fast"}
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                                <Card 
                                    className="p-6 cursor-pointer hover:border-accent hover:bg-white/5 transition-all text-left flex-1 border border-white/10"
                                    onClick={() => processFile(2)}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center mb-4">
                                        <Mic size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">2 Stems</h3>
                                    <p className="text-gray-400 text-sm">Vocals & Instrumental</p>
                                </Card>

                                <Card 
                                    className="p-6 cursor-pointer hover:border-primary hover:bg-white/5 transition-all text-left flex-1 border border-white/10"
                                    onClick={() => processFile(4)}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4">
                                        <Drum size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">4 Stems</h3>
                                    <p className="text-gray-400 text-sm">Vocals, Drums, Bass & Other</p>
                                </Card>
                            </div>
                            
                            <Button 
                                variant="ghost" 
                                className="mt-8 text-gray-400 hover:text-white"
                                onClick={() => {
                                    setFile(null);
                                    setState('upload');
                                }}
                            >
                                Cancel
                            </Button>
                        </motion.div>
                    )}

                    {state === 'processing' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                {/* Rotating rings */}
                                <div className="absolute inset-0 border-4 border-white/5 border-t-accent rounded-full animate-spin shadow-[0_0_15px_rgba(255,77,109,0.3)]"></div>
                                <div className="absolute inset-4 border-4 border-white/5 border-b-primary rounded-full animate-spin animation-delay-150"></div>
                                <Sliders size={32} className="text-white animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Demucs is Separating Stems...</h2>
                            <p className="text-gray-400 mb-8">Deploying Hybrid Transformer AI model. This requires heavy computational power.</p>

                            <div className="w-full max-w-md h-3 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary to-accent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>
                            <p className="text-accent font-mono text-sm mt-3">{progress}% complete</p>
                        </motion.div>
                    )}

                    {state === 'mixer' && (
                        <motion.div
                            key="mixer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-medium text-lg flex items-center gap-2"><Settings size={18} /> Mastering Workstation</h3>
                                {/* Replaced with global header Upload Another button */}
                            </div>

                            {/* The Stems */}
                            <div className="space-y-2">
                                {stems.map((stem) => (
                                    <StemTrack
                                        key={stem.id}
                                        stem={stem}
                                        isPlaying={isPlaying}
                                        masterTime={masterTime}
                                        onSeek={handleSyncSeek}
                                        globalTranspose={transpose}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Global Transport Bar - Fixed Bottom */}
            {state === 'mixer' && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-0 left-0 right-0 h-24 bg-[#141423]/95 backdrop-blur-xl border-t border-white/10 z-50 md:ml-64 flex items-center justify-between px-6 md:px-10"
                >
                    {/* Play Controls */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-14 h-14 bg-white text-black hover:scale-105 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"
                        >
                            {isPlaying ? <Pause size={24} className="fill-black" /> : <Play size={24} className="fill-black ml-1" />}
                        </button>
                        <div className="hidden md:block">
                            <h3 className="text-white font-bold">{trackInfo.name || "Track.wav"}</h3>
                            <p className="text-sm text-gray-400">
                                {trackInfo.bpm ? `${trackInfo.bpm} BPM` : '-- BPM'} • {trackInfo.key || '--'}
                            </p>
                        </div>
                    </div>

                    {/* Transpose Tool */}
                    <div className="flex-1 max-w-md px-8 hidden md:flex flex-col items-center">
                        <div className="flex justify-between w-full mb-1">
                            <span className="text-xs text-gray-400 font-mono">-12st</span>
                            <span className="text-xs text-white font-medium">Transpose: {transpose > 0 ? `+${transpose}` : transpose}</span>
                            <span className="text-xs text-gray-400 font-mono">+12st</span>
                        </div>
                        <input
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            value={transpose}
                            onChange={(e) => setTranspose(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-accent text-accent hover:bg-accent/10" onClick={handleDownloadAll}>
                            <Download size={18} className="mr-2" />
                            Zip Stems
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
