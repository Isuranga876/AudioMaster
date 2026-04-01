import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-dark">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-24 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Privacy Policy</h1>
                    <p className="text-gray-400">Last updated: March 2026</p>
                    
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold text-white">1. Data Collection</h2>
                            <p>We collect essential information to provide you with an optimal audio mastering experience. This includes basic account identifiers (email if registered via authentication) and the direct media files you upload to our backend processing servers for transformation.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">2. Audio Data Retention</h2>
                            <p>Your privacy and intellectual property are our highest priority. Audio files uploaded for mastering or stem extraction are stored securely in cloud buckets strictly for the duration they are available on your user dashboard. Original audio files, processed mixdowns, and separated stems can be structurally deleted from our storage upon your request.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">3. Third-Party Services</h2>
                            <p>We utilize trusted third-party providers, primarily Supabase, encompassing database management, continuous authentication, and cloud edge streaming. These services operate under strict data protection compliance protocols. We do not sell, distribute, or share your proprietary audio data to external ad networks.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">4. AI Training</h2>
                            <p>AudioMaster.AI unequivocally states that <strong className="text-white">your audio is never utilized as training data</strong> for our proprietary neural network or Demucs models unless explicitly opted-in via a public contribution framework.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">5. Cookies & Analytics</h2>
                            <p>We use functional cookies to persist your session authentication status. We may aggregate anonymous telemetry purely for optimizing backend processing latency and UI load performance metric measurements.</p>
                        </section>
                    </div>

                    <div className="pt-12 border-t border-white/10">
                        <Button onClick={() => navigate('/')} variant="outline" className="border-gray-600 text-gray-300 hover:text-white bg-white/5">
                            Back
                        </Button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
