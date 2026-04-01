import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Terms of Service</h1>
                    <p className="text-gray-400">Last updated: March 2026</p>
                    
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
                            <p>By accessing and using AudioMaster.AI ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. Use of the Service denotes your acceptance of these operational terms.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">2. User Responsibilities & Copyright</h2>
                            <p>You agree to only upload audio files for which you own the explicit copyright or possess the legal right to adapt and process. AudioMaster.AI does not claim any ownership rights over your uploaded material. The final mastered or separated audio outputs remain exclusively yours. You shall be solely responsible for any copyright infringement resulting from unauthorized audio uploads.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">3. Acceptable Use Policy</h2>
                            <p>The Service must not be used to process audio containing illicit or prohibited material. We reserve the right to ban accounts dynamically interacting with the platform in a malicious manner, or artificially overloading our AI processing capabilities via scripted bots.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">4. Provided Content and "As-Is"</h2>
                            <p>The platform provides AI-driven mastering and stem separation features "as-is". While our models strive for professional, high-fidelity results, AudioMaster.AI makes no warranty regarding absolute perfection or fitness for your particular commercial audio project.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white">5. Limitation of Liability</h2>
                            <p>In no event shall AudioMaster.AI, nor its directors, employees, or partners, be liable for indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, or goodwill across your professional works.</p>
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
