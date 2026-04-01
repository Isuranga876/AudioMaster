import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export default function About() {
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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About AudioMaster.AI</h1>
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6 leading-relaxed">
                        <p>
                            Welcome to <strong className="text-white">AudioMaster.AI</strong>, the platform built to democratize professional studio-quality audio processing. Our mission is to give every musician, producer, and audio enthusiast access to elite mastering and stem separation tools powered by cutting-edge Hybrid Transformer AI models.
                        </p>
                        <p>
                            We believe that obtaining high-fidelity, polished audio shouldn't require thousands of dollars in analog gear or complex software suites. By leveraging state-of-the-art machine learning, AudioMaster.AI analyzes your tracks and applies dynamic EQ, compression, and limiting—all automatically.
                        </p>
                        <p>
                            Likewise, our stem separation engine allows you to accurately dissect complex mixes into vocals, drums, bass, and other instruments with unprecedented clarity, utilizing models that are tailored for strict vocal sensitivity and artifact reduction.
                        </p>
                        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Our Commitment</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li><strong className="text-white">Unrestricted Quality:</strong> We provide uncompressed, high-fidelity files without hidden paywalls.</li>
                            <li><strong className="text-white">Privacy First:</strong> Your tracks belong to you. Audio processed on our servers is temporarily securely hosted and never used to train third-party models.</li>
                            <li><strong className="text-white">Continuous Innovation:</strong> We constantly upgrade our underlying models to ensure you're getting the bleeding edge of AI audio processing.</li>
                        </ul>
                    </div>

                    <div className="pt-12 border-t border-white/10">
                        <Button onClick={() => navigate('/')} variant="outline" className="border-gray-600 text-gray-300 hover:text-white bg-white/5">
                            Back to Home
                        </Button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
