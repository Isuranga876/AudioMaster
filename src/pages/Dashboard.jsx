import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Plus, Music, ListMusic, Settings2, MoreVertical, Trash2 } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const mockTracks = [
    { id: 1, name: 'Summer Vibes Mix.wav', date: 'Oct 24, 2026', theme: 'Warm Analog' },
    { id: 2, name: 'Podcast Episode 42.mp3', date: 'Oct 22, 2026', theme: 'Vocal Sparkle' },
    { id: 3, name: 'Midnight Synth.flac', date: 'Oct 20, 2026', theme: 'Bass Boost' },
];

function TrackCard({ track, onDelete, isLast }) {
    const isSplit = track.split_status === 'completed';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Format date nicely
    const dateStr = track.created_at && track.created_at !== 'Just now' 
        ? new Date(track.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Just now';

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4 flex-1 w-full">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Music size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{track.original_name || 'Unknown Track'}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span>{dateStr}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="text-accent">{isSplit ? 'Split Stems' : 'Mastered'}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 relative" ref={menuRef}>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                    <div className={`absolute right-0 w-48 bg-[#1B1B2D] border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden flex flex-col animate-in fade-in ${isLast ? 'bottom-12 slide-in-from-bottom-2' : 'top-12 slide-in-from-top-2'}`}>
                        <button 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 w-full text-left transition-colors"
                            onClick={() => {
                                setIsMenuOpen(false);
                                navigate(`/master?trackId=${track.id}`);
                            }}
                        >
                            <Settings2 size={16} /> Master Track
                        </button>
                        <button 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 w-full text-left transition-colors"
                            onClick={() => {
                                setIsMenuOpen(false);
                                navigate(`/split?trackId=${track.id}`);
                            }}
                        >
                            <ListMusic size={16} /> Separate Stems
                        </button>
                        <div className="w-full h-px bg-white/10 my-1" />
                        <button 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 w-full text-left transition-colors"
                            onClick={() => {
                                setIsMenuOpen(false);
                                onDelete(track.id);
                            }}
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingUrl, setPlayingUrl] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const userId = user ? user.id : 'demo-user';
                const response = await fetch(`http://localhost:8000/user-tracks/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTracks(data);
                }
            } catch (err) {
                console.error("Failed to load tracks", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTracks();
    }, [user]);

    const handleDeleteTrack = async (trackId) => {
        if (!window.confirm("Are you sure you want to completely delete this track? This action cannot be undone.")) return;
        
        try {
            const userId = user ? user.id : 'demo-user';
            const res = await fetch(`http://localhost:8000/track/${trackId}?userId=${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setTracks(tracks.filter(t => t.id !== trackId));
            } else {
                alert("Failed to delete track");
            }
        } catch (err) {
            console.error("Delete error", err);
        }
    };

    return (
        <div className="flex min-h-screen bg-dark">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-full overflow-x-hidden pb-48">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Library</h1>
                        <p className="text-gray-400">Manage and preview your processed tracks.</p>
                    </div>
                </header>

                <section className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-4">Recent Uploads</h3>
                    
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">
                            Loading your tracks...
                        </div>
                    ) : (
                        <>
                            {tracks.map((track, i) => (
                                <TrackCard 
                                    key={track.id} 
                                    track={track} 
                                    onDelete={handleDeleteTrack} 
                                    isLast={i === tracks.length - 1}
                                />
                            ))}

                            {tracks.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 mx-auto mb-4">
                                        <Music size={24} />
                                    </div>
                                    <h3 className="text-white font-medium mb-2">No tracks yet</h3>
                                    <p className="text-gray-400 mb-6">Your processed tracks will appear here securely.</p>
                                    <p className="text-sm text-gray-500">Go to the Mastering or Separation sections to upload a new tracking starting out.</p>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
