# 🎶 AudioMaster

**AudioMaster** is an intelligent, high-performance web application designed for processing and manipulating audio files using state-of-the-art machine learning models. Built with a responsive, animated React frontend and a robust FastAPI Python backend, AudioMaster gives you professional-grade audio tools in the browser.

---

## ✨ Key Features

### 🎧 AI Audio Splitting
Leveraging cutting-edge AI models (Demucs), AudioMaster can effortlessly separate any uploaded audio track into high-quality isolated stems. Whether you need an acapella extract, drums to sample, or basslines isolated, AudioMaster provides isolated tracks for:
- 🎤 **Vocals**
- 🥁 **Drums**
- 🎸 **Bass**
- 🎹 **Other Instruments**

### 🎛️ Audio Mastering
Apply professional-level audio adjustments and effects to your tracks using the Mastering toolkit. The backend applies these studio-grade transformations to finalize your tracks, making them sound polished and ready for distribution.
- Equalization (EQ) & Compression
- Dynamic Range Adjustments
- Reverb and saturation tuning

### 🎵 Pitch Shifting & Transposing
A powerful transposing feature to adjust the pitch of your audio tracks seamlessly without affecting the tempo or drastically diminishing the audio fidelity. Perfect for remixers, singers, and producers looking for quick key changes.

### 🌊 Real-time Audio Visualization
Built with `wavesurfer.js`, AudioMaster provides a beautiful, interactive waveform visualization for your audio. Easily navigate through different parts of the playback, see visual feedback of frequency and amplitude, and manipulate playback effortlessly.

### 🔐 Secure & Synchronized
User accounts, authentication, and data persistency securely managed with **Supabase**. Your files and settings are safely tied to your secure profile.

---

## 🛠️ Technology Stack

### Frontend
The user interface is crafted to be blazingly fast, modern, and highly interactive.
* **Framework:** React 19 powered by Vite for minimal bundle sizes and fast hot-module reloading.
* **Styling:** Tailwind CSS 4 for utility-first, fully responsive design alongside dark/light mode scaling.
* **Animations:** Framer Motion for buttery-smooth micro-interactions, page transitions, and component mounts.
* **Audio Engine:** `Tone.js` for precise in-browser audio timing and `wavesurfer.js` for rendering accurate audio waveforms.
* **Icons:** `lucide-react` for crisp, consistent UI icons.

### Backend
The heavy lifting of audio processing and AI inference is handled by a hyper-fast asynchronous Python backend.
* **Core Framework:** FastAPI & Uvicorn for asynchronous, high-throughput REST API connections.
* **Audio ML Engine:** Facebook's `Demucs` for world-class music source separation.
* **Audio Processing Processing:** `Librosa` and Spotify's `Pedalboard` handle the complex signal processing, pitch shifting, and mastering effects.
* **Media Handling:** `ffmpeg-python` for rapid converting, muxing, and demuxing of an expansive range of audio codecs.

### Infrastructure
* **Database & Auth:** Supabase (PostgreSQL + GoTrue)

---

## 🚀 Getting Started

To run this project locally, follow these steps:

### Prerequisites
- Node.js (v18 or higher)
- Python (3.10 or higher)
- FFmpeg installed system-wide

### 1. Connecting the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   ```
3. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server (usually on port 8000):
   ```bash
   uvicorn main:app --reload
   ```

### 2. Running the Frontend
1. Open a new terminal and navigate to the root directory `audio-master`.
2. Install the javascript dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`. Make sure the frontend `.env.local` is correctly pointing to your backend and Supabase instances!

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License
This project is proprietary and completely closed-source for current active development, pending open-source licensing.
