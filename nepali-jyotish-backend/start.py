import socket
import subprocess
import os

def find_free_port():
    """Finds an absolutely guaranteed free, unblocked port on this Mac."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))  # OS will assign a random free port
        return s.getsockname()[1]

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print("=" * 50)
    print(f"🚀 Launching your Nepali Jyotish app on http://127.0.0.1:{port}")
    print("=" * 50)
    
    # Run uvicorn automatically on the configured port
    try:
        uvicorn_path = os.path.join(os.path.dirname(__file__), "venv", "bin", "uvicorn")
        subprocess.run([uvicorn_path, "main:app", "--reload", "--port", str(port)])
    except KeyboardInterrupt:
        print("\n\nServer gracefully stopped!")
