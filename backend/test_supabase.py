import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

if not supabase:
    print("No supabase client configured.")
    exit(1)

test_id = str(uuid.uuid4())
user_id = str(uuid.uuid4()) # fake user for test

print("Testing Supabase Table Insert...")
try:
    res = supabase.table("tracks").insert({
        "id": test_id,
        "user_id": user_id,
        "original_name": "test.mp3",
        "status": "completed"
    }).execute()
    print("Insert Success:", res)
except Exception as e:
    print("Insert Error:", e)

print("\nTesting Supabase Storage Upload...")
try:
    with open("test.mp3", "wb") as f:
         f.write(b"fake audio data")
    
    with open("test.mp3", "rb") as f:
         res = supabase.storage.from_("Masteraudio").upload(
             file=f,
             path=f"{user_id}/{test_id}_test.mp3",
             file_options={"content-type": "audio/mpeg"}
         )
    print("Upload Success:", res)
except Exception as e:
    print("Upload Error:", e)

if os.path.exists("test.mp3"):
    os.remove("test.mp3")
