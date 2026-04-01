import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function Contact() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.message) {
            setErrorMessage('Please fill in all fields.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('http://localhost:8000/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to send message.');
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' }); // Clear form
        } catch (error) {
            console.error('Contact error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'An error occurred while sending your message.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-dark">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-24 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Contact Us</h1>
                    <p className="text-gray-400 text-lg mb-8">
                        Have a question, feedback, or need support? Fill out the form below or send us an email directly.
                    </p>

                    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                        
                        {status === 'success' && (
                            <div className="bg-green-500/20 text-green-400 p-4 rounded-lg flex items-center border border-green-500/30">
                                <CheckCircle className="mr-3 flex-shrink-0" size={20} />
                                <p>Your message has been sent successfully!</p>
                            </div>
                        )}
                        
                        {status === 'error' && (
                            <div className="bg-red-500/20 text-red-400 p-4 rounded-lg flex items-center border border-red-500/30">
                                <XCircle className="mr-3 flex-shrink-0" size={20} />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                                    placeholder="Your name" 
                                    disabled={status === 'loading'}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                                    placeholder="your@email.com" 
                                    disabled={status === 'loading'}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Message</label>
                            <textarea 
                                rows="5" 
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none" 
                                placeholder="How can we help?" 
                                disabled={status === 'loading'}
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={status === 'loading'}
                            className="w-full py-6 text-lg bg-primary hover:bg-primary/80 transition-all font-bold group"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="animate-spin mr-2" size={20} />
                            ) : (
                                <MessageSquare className="mr-2 group-hover:scale-110 transition-transform" size={20} />
                            )}
                            {status === 'loading' ? 'Sending...' : 'Send Message'}
                        </Button>
                    </form>

                    <div className="flex items-center justify-between pt-12">
                        <div className="flex items-center text-gray-400">
                            <Mail className="mr-3" size={20} />
                            <a href="mailto:isurangauni876@gmail.com" className="hover:text-primary transition-colors">
                                isurangauni876@gmail.com
                            </a>
                        </div>
                        <Button onClick={() => navigate('/')} variant="ghost" className="text-gray-400 hover:text-white">
                            Back
                        </Button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
