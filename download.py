import json
import subprocess
import sys
import os
from http.server import BaseHTTPRequestHandler

def get_download_info(url):
    """Use yt-dlp to extract video info and download URLs"""
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--extractor-args", "instagram:direct_video=true",
        url
    ]
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=30
    )
    
    if result.returncode != 0:
        raise Exception(result.stderr or "yt-dlp failed")
    
    data = json.loads(result.stdout)
    return data

def build_options(data):
    """Build list of download options from yt-dlp output"""
    options = []
    
    # Multiple formats available
    formats = data.get("formats", [])
    
    if formats:
        # Filter video formats with direct URLs
        video_formats = [
            f for f in formats
            if f.get("url") and f.get("vcodec") not in (None, "none")
        ]
        # Sort by quality descending
        video_formats.sort(key=lambda f: (f.get("height") or 0), reverse=True)
        
        seen_heights = set()
        for fmt in video_formats:
            height = fmt.get("height") or 0
            if height in seen_heights:
                continue
            seen_heights.add(height)
            
            if height >= 1080:
                badge = "1080p"
            elif height >= 720:
                badge = "HD"
            elif height >= 480:
                badge = "480p"
            elif height > 0:
                badge = f"{height}p"
            else:
                badge = "SD"
            
            options.append({
                "label": badge,
                "url": fmt["url"],
                "ext": fmt.get("ext", "mp4"),
            })
        
        # Also add audio-only if available
        audio_formats = [
            f for f in formats
            if f.get("url") and f.get("vcodec") in (None, "none") and f.get("acodec") not in (None, "none")
        ]
        if audio_formats:
            best_audio = sorted(audio_formats, key=lambda f: f.get("abr") or 0, reverse=True)[0]
            options.append({
                "label": "Audio only",
                "url": best_audio["url"],
                "ext": best_audio.get("ext", "m4a"),
            })
    
    # Fallback: single URL
    if not options and data.get("url"):
        options.append({
            "label": "Best Quality",
            "url": data["url"],
            "ext": data.get("ext", "mp4"),
        })
    
    return options

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # CORS headers
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        try:
            from urllib.parse import urlparse, parse_qs
            query = parse_qs(urlparse(self.path).query)
            url = query.get("url", [None])[0]
            
            if not url:
                self.wfile.write(json.dumps({"error": "Missing url parameter"}).encode())
                return
            
            # Validate URL is Instagram or TikTok
            if not ("instagram.com" in url or "tiktok.com" in url):
                self.wfile.write(json.dumps({"error": "Only Instagram and TikTok URLs supported"}).encode())
                return
            
            data = get_download_info(url)
            options = build_options(data)
            
            if not options:
                self.wfile.write(json.dumps({"error": "No download links found"}).encode())
                return
            
            response = {
                "title": data.get("title") or data.get("id") or "Video",
                "thumbnail": data.get("thumbnail"),
                "platform": "instagram" if "instagram.com" in url else "tiktok",
                "options": options,
            }
            self.wfile.write(json.dumps(response).encode())
        
        except subprocess.TimeoutExpired:
            self.wfile.write(json.dumps({"error": "Request timed out. Try again."}).encode())
        except Exception as e:
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()
