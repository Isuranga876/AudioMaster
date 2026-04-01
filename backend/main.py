import os
import uuid
import asyncio
import subprocess
import shutil
import json
import numpy as np
import librosa
import zipfile
import io
import ffmpeg
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pedalboard import (
    Pedalboard, Compressor, HighpassFilter, LowpassFilter,
    HighShelfFilter, LowShelfFilter, PeakFilter, Distortion, Limiter, Reverb, Gain
)
from pedalboard.io import AudioFile
from pedalboard.io import AudioFile
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not os.getenv("SUPABASE_SERVICE_ROLE_KEY") and SUPABASE_KEY:
    print("\nWARNING: SUPABASE_SERVICE_ROLE_KEY is not set in backend/.env!")
    print("You are using the ANON Key. Uploading files and inserting rows might fail due to Row-Level Security (RLS).")
    print("Please add SUPABASE_SERVICE_ROLE_KEY to your backend/.env file.\n")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

local_tracks_db = {} # In-memory fallback if no Supabase

app = FastAPI(title="AudioMaster.AI API")

# Setup CORS to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

class MasteringTheme:
    def __init__(self, name, board=None, stereo_expansion=1.0):
        self.name = name
        self.board = board if board else Pedalboard()
        self.stereo_expansion = stereo_expansion
        
    def process(self, audio_data, sample_rate):
        # Apply theme-specific pedalboard
        processed = self.board(audio_data, sample_rate)
        
        # Apply stereo expansion if stereo
        if processed.ndim == 2 and processed.shape[0] == 2 and self.stereo_expansion != 1.0:
            left, right = processed[0], processed[1]
            mid = (left + right) / 2
            side = (left - right) / 2
            side = side * self.stereo_expansion
            processed[0] = mid + side
            processed[1] = mid - side
            
        return processed

# Define themes
themes_config = {
    "neutral": MasteringTheme(
        "NATURAL / CLEAN",
        Pedalboard([
            Compressor(threshold_db=-20.0, ratio=2.0),
            HighShelfFilter(cutoff_frequency_hz=12000, gain_db=1.0)
        ])
    ),
    "fire": MasteringTheme(
        "FIRE / BASS BOOSTED",
        Pedalboard([
            LowShelfFilter(cutoff_frequency_hz=100, gain_db=5.0),
            Compressor(threshold_db=-18.0, ratio=4.0, attack_ms=5.0, release_ms=100.0),
            Gain(gain_db=1.5)
        ])
    ),
    "ethereal": MasteringTheme(
        "MAGICAL / ETHEREAL",
        Pedalboard([
            Reverb(room_size=0.8, damping=0.5, wet_level=0.12),
            HighShelfFilter(cutoff_frequency_hz=15000, gain_db=2.0)
        ]),
        stereo_expansion=1.4
    ),
    "vibrant": MasteringTheme(
        "VIBRANT / BRIGHT",
        Pedalboard([
            PeakFilter(cutoff_frequency_hz=4500, gain_db=3.0, q=1.0),
            Compressor(threshold_db=-15.0, ratio=3.0)
        ])
    )
}

def analyze_and_normalize(audio_data, target_peak_db=-1.0):
    """Normalize audio to a True Peak target gently."""
    peak = np.max(np.abs(audio_data))
    if peak > 0:
        target_linear = 10 ** (target_peak_db / 20)
        # Avoid huge jumps if the track is extremely quiet
        max_gain = 4.0 # Cap gain at approx +12dB to prevent raising noise floor
        gain_factor = min(target_linear / peak, max_gain)
        audio_data = audio_data * gain_factor
    return audio_data

def process_all_themes(input_path: str, file_id: str, userId: str, original_filename: str):
    """
    Applies professional mastering chain and all available themes to the audio using pedalboard.
    Uses ffmpeg-python for format conversion if needed.
    """
    try:
        print(f"Loading '{input_path}'...")
        
        # Convert to temp wav for pedalboard just in case it's not wav
        wav_path = os.path.join(UPLOAD_DIR, f"{file_id}_temp.wav")
        (
            ffmpeg
            .input(input_path)
            .output(wav_path, format='wav', ar=44100, ac=2)
            .overwrite_output()
            .run(quiet=True)
        )
        
        # Read with pedalboard io
        with AudioFile(wav_path) as f:
            sample_rate = f.samplerate
            audio_data = f.read(f.frames)
            
        print("Pre-Analysis & Normalization...")
        audio_data = analyze_and_normalize(audio_data, -1.0)
        
        # Professional Signal Chain Logic (The "Expert" Secret)
        print("Applying Core Corrective EQ & Compression...")
        core_board = Pedalboard([
            HighpassFilter(cutoff_frequency_hz=40.0), # Low-cut (High Pass) at 40Hz
            PeakFilter(cutoff_frequency_hz=350.0, gain_db=-2.0, q=0.5), # Dynamic Notch at 350Hz (reduced)
            Compressor(threshold_db=-12.0, ratio=2.5, attack_ms=15.0, release_ms=150.0), # Smoother glue compression
            Gain(gain_db=0.5), # Very subtle makeup gain instead of distortion
        ])
        audio_data = core_board(audio_data, sample_rate)
        
        # Core Stereo Expansion (1.1x)
        if audio_data.ndim == 2 and audio_data.shape[0] == 2:
            left, right = audio_data[0], audio_data[1]
            mid = (left + right) / 2
            side = (left - right) / 2
            side *= 1.1 # Expand stereo width
            audio_data[0] = mid + side
            audio_data[1] = mid - side
            
        for theme_id, theme in themes_config.items():
            print(f"Applying theme '{theme.name}'...")
            themed_audio = theme.process(audio_data.copy(), sample_rate)
            
            # Final Limiting (-14.0 LUFS target approximation, -1.0dB TP ceiling)
            # Use a much slower release for flutes/vocals to prevent "pumping" (unstable volume)
            limiter = Pedalboard([
                Gain(gain_db=1.0), # Very gentle push 
                Limiter(threshold_db=-1.0, release_ms=450.0) # 450ms is much more transparent for sustained notes
            ])
            final_audio = limiter(themed_audio, sample_rate)
            
            # Ensure hard clip at -1.0dB TP just in case
            final_audio = analyze_and_normalize(final_audio, -1.0)
            
            out_wav = os.path.join(OUTPUT_DIR, f"{file_id}_{theme_id}.wav")
            out_mp3 = os.path.join(OUTPUT_DIR, f"{file_id}_{theme_id}.mp3")
            
            with AudioFile(out_wav, 'w', sample_rate, final_audio.shape[0]) as f:
                f.write(final_audio)
                
            # Convert back to mp3 320k using ffmpeg
            (
                ffmpeg
                .input(out_wav)
                .output(out_mp3, audio_bitrate='320k', format='mp3')
                .overwrite_output()
                .run(quiet=True)
            )
            
            # Clean up temp wav for theme
            os.remove(out_wav)
            
            # Upload to Supabase Storage
            if supabase and userId != 'demo-user':
                try:
                    print(f"Uploading {theme_id} to Supabase Storage...")
                    with open(out_mp3, "rb") as f:
                        supabase.storage.from_("Masteraudio").upload(
                            file=f,
                            path=f"{userId}/{file_id}_{theme_id}.mp3",
                            file_options={"content-type": "audio/mpeg"}
                        )
                except Exception as e:
                    print(f"Supabase storage upload error for {theme_id}: {e}")
            
        # Clean up source temp wav
        if os.path.exists(wav_path):
            os.remove(wav_path)
            
        # Upload original file to storage
        if supabase and userId != 'demo-user':
            try:
                print("Uploading original file to Supabase Storage...")
                with open(input_path, "rb") as f:
                     supabase.storage.from_("Masteraudio").upload(
                         file=f,
                         path=f"{userId}/{file_id}_original.mp3",
                         file_options={"content-type": "audio/mpeg"}
                     )
            except Exception as e:
                 print(f"Supabase storage upload error for original file: {e}")

        # Insert record into database
        if supabase and userId != 'demo-user':
            try:
                print("Inserting record into Supabase tracks table...")
                supabase.table("tracks").insert({
                    "id": file_id,
                    "user_id": userId,
                    "original_name": original_filename,
                    "status": "completed"
                }).execute()
            except Exception as e:
                print(f"Supabase database insert error: {e}")
        
        # Save to local fallback db as well
        local_tracks_db[file_id] = {
            "status": "completed",
            "split_status": "none",
            "original_name": original_filename
        }
                
        print("Processing of all themes finished successfully.")

    except Exception as e:
        print(f"Error processing audio: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

class ContactForm(BaseModel):
    name: str
    email: str
    message: str

def send_contact_email(name: str, email: str, message: str):
    """Sends an email notification using SMTP."""
    smtp_user = os.getenv("EMAIL_HOST_USER")
    smtp_password = os.getenv("EMAIL_HOST_PASSWORD")
    
    if not smtp_user or not smtp_password:
        print("Warning: Email credentials not configured. Skipping email notification.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = "isurangauni876@gmail.com"
        msg['Subject'] = f"New Contact Request from {name}"
        
        body = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_user, "isurangauni876@gmail.com", text)
        server.quit()
        print("Contact email sent successfully.")
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.post("/contact")
async def handle_contact(background_tasks: BackgroundTasks, form: ContactForm):
    """
    Endpoint to receive contact messages, save them to Supabase (if configured),
    and send an email notification.
    """
    # 1. Save to Supabase
    if supabase:
        try:
            supabase.table("contact_messages").insert({
                "name": form.name,
                "email": form.email,
                "message": form.message
            }).execute()
        except Exception as e:
            print(f"Supabase error inserting contact message: {e}")
            # we don't return error to user so we can still try to send the email
            
    # 2. Send email notification in background
    background_tasks.add_task(send_contact_email, form.name, form.email, form.message)
    
    return {"status": "success", "message": "Contact message received"}


@app.post("/master")
async def master_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    userId: str = Form(None)
):
    """
    Endpoint to upload an audio file and begin mastering all themes.
    Returns a unique file_id immediately.
    """
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    
    input_filename = f"{file_id}_raw{file_ext}"
    input_path = os.path.join(UPLOAD_DIR, input_filename)
    
    # Save the uploaded file
    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())
        
    # Add initial pending state to local db so dashboard sees it instantly
    local_tracks_db[file_id] = {
        "status": "pending",
        "split_status": "none",
        "original_name": file.filename
    }
        
    print(f"Starting synchronous processing of all themes for {file_id}")
    process_all_themes(input_path, file_id, userId, file.filename)
    
    return {
        "status": "success",
        "file_id": file_id,
        "message": "Audio processed successfully"
    }

@app.get("/stream/{file_id}")
async def stream_master(file_id: str, theme: str = "neutral"):
    """
    Streams the specific processed MP3 file for a given theme to the player.
    """
    output_filename = f"{file_id}_{theme}.mp3"
    if theme == "original":
        # Get raw file extension
        import glob
        raw_files = glob.glob(os.path.join(UPLOAD_DIR, f"{file_id}_raw.*"))
        if raw_files:
            output_path = raw_files[0]
            output_filename = os.path.basename(output_path)
        else:
            return {"error": "Original file not found"}, 404
    else:
        output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    if not os.path.exists(output_path):
        return {"error": "File not found or still processing"}, 404
        
    return FileResponse(
        path=output_path, 
        media_type="audio/mpeg", 
        filename=output_filename,
        content_disposition_type="inline" # This prevents auto-download
    )

@app.get("/download/{file_id}")
async def download_master(file_id: str, theme: str = "neutral"):
    """
    Serves the specific processed MP3 file as an attachment for downloading.
    """
    output_filename = f"{file_id}_{theme}.mp3"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    if not os.path.exists(output_path):
        return {"error": "File not found or still processing"}, 404
        
    return FileResponse(
        path=output_path, 
        media_type="audio/mpeg", 
        filename=output_filename,
        content_disposition_type="attachment" # This forces download
    )

def get_bpm_and_key(file_path):
    try:
        y, sr = librosa.load(file_path, sr=22050, mono=True)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = int(round(tempo[0] if isinstance(tempo, np.ndarray) else tempo))
        
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_vals = np.sum(chroma, axis=1)
        
        maj_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        min_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        maj_profile = maj_profile / np.linalg.norm(maj_profile)
        min_profile = min_profile / np.linalg.norm(min_profile)
        chroma_vals = chroma_vals / np.linalg.norm(chroma_vals)
        
        maj_corrs = [np.correlate(np.roll(chroma_vals, -i), maj_profile)[0] for i in range(12)]
        min_corrs = [np.correlate(np.roll(chroma_vals, -i), min_profile)[0] for i in range(12)]
        
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        max_maj = max(maj_corrs)
        max_min = max(min_corrs)
        
        if max_maj > max_min:
            key = keys[maj_corrs.index(max_maj)] + ' Major'
        else:
            key = keys[min_corrs.index(max_min)] + ' Minor'
            
        return bpm, key
    except Exception as e:
        print(f"Error extracting BPM/Key: {e}")
        return 120, "C Minor"

def run_demucs_split(input_path: str, file_id: str, userId: str, num_stems: int = 4, vocal_sensitivity: str = 'normal'):
    """
    Background task to run Demucs and upload the stems to Supabase.
    """
    try:
        if supabase and userId and userId != 'demo-user':
            try:
                supabase.table("tracks").update({"split_status": "processing"}).eq("id", file_id).execute()
            except Exception as e:
                print(f"Failed to update status to processing: {e}")

        print(f"Extracting BPM and Key for {file_id}")
        bpm, key = get_bpm_and_key(input_path)
        print(f"Extracted: {bpm} BPM, {key}")

        print(f"Starting Demucs for {file_id}")
        if file_id not in local_tracks_db:
            local_tracks_db[file_id] = {}
        local_tracks_db[file_id].update({"split_status": "processing", "stems": {}, "bpm": bpm, "key": key})
        
        # Demucs command
        model_name = "htdemucs_ft" if vocal_sensitivity == 'high' else "htdemucs"
        cmd = ["python", "-m", "demucs.separate", "-n", model_name, "--mp3", "-d", "cpu", "-o", OUTPUT_DIR, input_path]
        if vocal_sensitivity == 'high':
            cmd.extend(["--shifts", "2"])
            
        if num_stems == 2:
            cmd.extend(["--two-stems", "vocals"])
            
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )
        
        if process.returncode != 0:
            print(f"Demucs failed: {process.stderr}")
            if supabase and userId and userId != 'demo-user':
                supabase.table("tracks").update({"split_status": "error"}).eq("id", file_id).execute()
            return
            
        print("Demucs processing completed successfully.")
        
        basename = os.path.splitext(os.path.basename(input_path))[0]
        demucs_out_dir = os.path.join(OUTPUT_DIR, model_name, basename)
        
        stem_names = ["vocals", "drums", "bass", "other"] if num_stems == 4 else ["vocals", "no_vocals"]
        stems_data = {}
        
        for stem in stem_names:
            stem_file = os.path.join(demucs_out_dir, f"{stem}.mp3")
            front_stem = "other" if stem == "no_vocals" else stem
            
            if os.path.exists(stem_file):
                local_save_path = os.path.join(OUTPUT_DIR, f"{file_id}_{front_stem}.mp3")
                shutil.copy2(stem_file, local_save_path) # Save it locally for the fallback endpoint!

                if supabase and userId and userId != 'demo-user':
                    try:
                        print(f"Uploading {front_stem} stem to Supabase...")
                        storage_path = f"{userId}/stems/{file_id}_{front_stem}.mp3"
                        with open(stem_file, "rb") as f:
                            supabase.storage.from_("Masteraudio").upload(
                                file=f,
                                path=storage_path,
                                file_options={"content-type": "audio/mpeg"}
                            )
                        public_url = supabase.storage.from_("Masteraudio").get_public_url(storage_path)
                        stems_data[front_stem] = public_url
                    except Exception as e:
                        print(f"Error uploading {front_stem}: {e}")
                        stems_data[front_stem] = f"/stems/local/{file_id}/{front_stem}"
                else:
                    # For local frontend testing without Supabase
                    stems_data[front_stem] = f"/stems/local/{file_id}/{front_stem}"
            else:
                print(f"Stem file missing: {stem_file}")
                
        # Clean up temp files
        if os.path.exists(input_path):
            os.remove(input_path)
            
        if os.path.exists(demucs_out_dir):
            shutil.rmtree(demucs_out_dir, ignore_errors=True)
            
        stems_data["bpm"] = bpm
        stems_data["key"] = key
            
        # Update db
        if supabase and userId and userId != 'demo-user':
            try:
                supabase.table("tracks").update({
                    "split_status": "completed",
                    "stems": stems_data
                }).eq("id", file_id).execute()
                print("Supabase updated with stems.")
            except Exception as e:
                print(f"Error updating track in Supabase: {e}")
        
        if file_id not in local_tracks_db:
            local_tracks_db[file_id] = {}
        local_tracks_db[file_id].update({
            "split_status": "completed", 
            "stems": stems_data,
            "bpm": bpm,
            "key": key
        })
                
    except Exception as e:
        print(f"Critical error in run_demucs_split: {e}")
        if file_id not in local_tracks_db:
            local_tracks_db[file_id] = {}
        local_tracks_db[file_id].update({"split_status": "error", "stems": {}})
        if supabase and userId and userId != 'demo-user':
            try:
                supabase.table("tracks").update({"split_status": "error"}).eq("id", file_id).execute()
            except:
                pass

@app.post("/split")
async def split_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    userId: str = Form(None),
    num_stems: int = Form(4),
    vocal_sensitivity: str = Form('normal')
):
    """
    Endpoint to trigger Demucs stem separation.
    """
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    
    input_filename = f"{file_id}_split_raw{file_ext}"
    input_path = os.path.join(UPLOAD_DIR, input_filename)
    
    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())
        
    print(f"Queueing stem separation task for {file_id}")
    
    # Also create a track record in Supabase immediately
    if supabase and userId and userId != 'demo-user':
        try:
            supabase.table("tracks").insert({
                "id": file_id,
                "user_id": userId,
                "original_name": file.filename,
                "status": "pending",
                "split_status": "started"
            }).execute()
        except Exception as e:
            print(f"Supabase database insert error: {e}")

    local_tracks_db[file_id] = {
        "status": "pending",
        "split_status": "started",
        "original_name": file.filename,
        "num_stems": num_stems,
        "vocal_sensitivity": vocal_sensitivity
    }

    background_tasks.add_task(run_demucs_split, input_path, file_id, userId, num_stems, vocal_sensitivity)
    
    return {
        "status": "success",
        "file_id": file_id,
        "message": "Stem separation processing started"
    }

@app.get("/stems/local/{file_id}/{stem}")
async def get_local_stem(file_id: str, stem: str):
    """Fallback endpoint when not using Supabase storage."""
    # (Just an example placeholder path, usually we host via Supabase)
    output_filename = f"{file_id}_{stem}.mp3"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    if os.path.exists(output_path):
        return FileResponse(path=output_path, media_type="audio/mpeg")
    return {"error": "File not found"}, 404

@app.get("/track/{file_id}")
async def get_track(file_id: str):
    """
    Get the status of a track (used for polling).
    """
    if supabase:
        try:
            response = supabase.table("tracks").select("*").eq("id", file_id).execute()
            if response.data and len(response.data) > 0:
                track = response.data[0]
                # If Supabase has it, return it. But also check if stems exist locally in dev
                if not track.get("stems") and file_id in local_tracks_db:
                    track["split_status"] = local_tracks_db[file_id].get("split_status", track.get("split_status"))
                    track["stems"] = local_tracks_db[file_id].get("stems", {})
                
                # Expose bpm and key if available
                if file_id in local_tracks_db:
                    if "bpm" in local_tracks_db[file_id]:
                        track["bpm"] = local_tracks_db[file_id]["bpm"]
                    if "key" in local_tracks_db[file_id]:
                        track["key"] = local_tracks_db[file_id]["key"]
                return track
        except Exception as e:
            print(f"Supabase query error: {e}")
            
    # Fallback to local memory
    if file_id in local_tracks_db:
        return local_tracks_db[file_id]
        
    return {"error": "Track not found", "split_status": "none"}, 404

@app.delete("/track/{file_id}")
async def delete_track(file_id: str, userId: str):
    """
    Delete a track completely.
    """
    # Delete from local DB immediately
    if file_id in local_tracks_db:
        del local_tracks_db[file_id]

    if supabase and userId and userId != 'demo-user':
        try:
            supabase.table("tracks").delete().eq("id", file_id).eq("user_id", userId).execute()
            
            # Optional: Supabase Storage cleanup could go here
            # e.g., supabase.storage.from_("Masteraudio").remove([f"{userId}/{file_id}_original.mp3", ...])
            
            return {"status": "success", "message": "Track deleted"}
        except Exception as e:
            print(f"Supabase delete error: {e}")
            return {"error": str(e)}, 500

    return {"status": "success", "message": "Track deleted locally"}

@app.get("/user-tracks/{user_id}")
async def get_user_tracks(user_id: str):
    """
    Get all tracks for a specific user.
    """
    db_tracks = []
    if supabase and user_id != 'demo-user':
        try:
            # Assuming 'created_at' exists by default in Supabase tables
            response = supabase.table("tracks").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            db_tracks = response.data or []
        except Exception as e:
            print(f"Supabase query error: {e}")
            # If created_at fails because schema missing it, try without ordering
            try:
                response = supabase.table("tracks").select("*").eq("user_id", user_id).execute()
                db_tracks = response.data or []
            except Exception as e2:
                print(f"Supabase query error fallback: {e2}")
                
    # Always merge local_tracks_db for the current session to ensure visibility!
    # Because Supabase might be failing due to RLS or schema issues, which shouldn't block the user's local session.
    db_track_ids = {t["id"] for t in db_tracks} if db_tracks else set()
    
    for tid, tdata in local_tracks_db.items():
        if tid not in db_track_ids:
            db_tracks.append({
                "id": tid,
                "original_name": tdata.get("original_name", f"Local Track {tid[:8]}"),
                "status": tdata.get("status", "completed"),
                "split_status": tdata.get("split_status", "none"),
                "created_at": "Just now"
            })
            
    return db_tracks

@app.get("/download-all-stems/{file_id}")
async def download_all_stems(file_id: str):
    stems = ["vocals", "drums", "bass", "other"]
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for stem in stems:
            stem_path = os.path.join(OUTPUT_DIR, f"{file_id}_{stem}.mp3")
            if os.path.exists(stem_path):
                zip_file.write(stem_path, f"{stem}.mp3")
                
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=stems_{file_id}.zip"}
    )



