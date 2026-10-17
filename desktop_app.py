"""
Albion Artisan — Ultra-Lightweight Native Desktop App Controller
Runs the entire calculator in a single Python process (serving the compiled React frontend
directly from Django + SQLite) with ZERO Node.js/Vite background overhead and ZERO terminal windows.
Automatically stops the backend server the moment you close the app window.
"""
import os
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
DIST_INDEX = FRONTEND_DIR / "dist" / "index.html"
APP_PROFILE_DIR = ROOT_DIR / ".desktop_app_profile"
PORT = 8000
APP_URL = f"http://127.0.0.1:{PORT}"

# Hide subprocess console windows on Windows
CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0


def get_python_exe() -> str:
    venv_py = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
    if venv_py.is_file():
        return str(venv_py)
    backend_venv_py = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
    if backend_venv_py.is_file():
        return str(backend_venv_py)
    return sys.executable


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex(("127.0.0.1", port)) == 0


def ensure_frontend_built():
    """Builds the React frontend automatically if dist is missing or older than source edits."""
    dist_manifest = FRONTEND_DIR / "dist" / "manifest.json"
    needs_build = not DIST_INDEX.is_file() or not dist_manifest.is_file()

    if not needs_build:
        try:
            dist_mtime = DIST_INDEX.stat().st_mtime
            for check_file in [
                FRONTEND_DIR / "index.html",
                FRONTEND_DIR / "src" / "App.jsx",
                FRONTEND_DIR / "src" / "components" / "Header.jsx",
                FRONTEND_DIR / "src" / "services" / "api.js",
            ]:
                if check_file.is_file() and check_file.stat().st_mtime > dist_mtime:
                    needs_build = True
                    break
        except Exception:
            pass

    if not needs_build:
        return

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    subprocess.run(
        [npm_cmd, "run", "build"],
        cwd=str(FRONTEND_DIR),
        creationflags=CREATE_NO_WINDOW,
        check=False,
    )


def run_migrations(python_exe: str):
    """Ensures local db.sqlite3 has the latest tables (including MarketPriceSnapshot)."""
    subprocess.run(
        [python_exe, "manage.py", "migrate", "--noinput"],
        cwd=str(BACKEND_DIR),
        creationflags=CREATE_NO_WINDOW,
        check=False,
    )


def wait_for_server(url: str, timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1.0) as resp:
                if resp.status < 500:
                    return True
        except Exception:
            time.sleep(0.25)
    return False


def find_app_browser() -> str | None:
    """Finds Edge or Chrome on Windows to render a standalone borderless Desktop App window."""
    candidates = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def find_adc_exe() -> str | None:
    """Finds the Albion Data Client (ADC) executable if installed on this PC."""
    candidates = [
        os.path.expandvars(r"%LocalAppData%\AlbionDataClient\albiondata-client.exe"),
        os.path.expandvars(r"%ProgramFiles%\AlbionDataClient\albiondata-client.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\AlbionDataClient\albiondata-client.exe"),
        str(ROOT_DIR / "albiondata-client.exe"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def main():
    python_exe = get_python_exe()

    # 1. Ensure production frontend bundle exists (so Node.js/Vite never needs to run!)
    ensure_frontend_built()

    # 2. Ensure local SQLite database migrations are applied
    run_migrations(python_exe)

    # 3. If Albion Data Client (ADC) is installed on this PC, start it silently in the background!
    adc_proc = None
    adc_exe = find_adc_exe()
    if adc_exe:
        try:
            adc_proc = subprocess.Popen(
                [adc_exe],
                creationflags=CREATE_NO_WINDOW,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            adc_proc = None

    # 4. Start lightweight single-process Django server (--noreload saves RAM on older PCs)
    django_proc = None
    if not is_port_in_use(PORT):
        env = os.environ.copy()
        # Force local SQLite when running as the local Desktop App
        env.pop("DATABASE_URL", None)
        env.pop("DATABASE_PUBLIC_URL", None)
        env.pop("POSTGRES_URL", None)
        env.pop("PGHOST", None)

        django_proc = subprocess.Popen(
            [python_exe, "manage.py", "runserver", f"127.0.0.1:{PORT}", "--noreload", "--insecure"],
            cwd=str(BACKEND_DIR),
            env=env,
            creationflags=CREATE_NO_WINDOW,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        wait_for_server(f"{APP_URL}/api/refining/constants/")

    # 5. Launch Standalone Borderless Desktop App Window
    browser_exe = find_app_browser()
    try:
        if browser_exe:
            APP_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
            app_proc = subprocess.Popen(
                [
                    browser_exe,
                    f"--app={APP_URL}",
                    f"--user-data-dir={APP_PROFILE_DIR}",
                    "--window-size=1440,900",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--disable-extensions",
                ],
                creationflags=CREATE_NO_WINDOW,
            )
            # Wait until the user closes the Desktop App window
            app_proc.wait()
        else:
            import webbrowser
            webbrowser.open(APP_URL)
            if django_proc:
                django_proc.wait()
    finally:
        # 6. Automatically shut down the Python backend and ADC the moment the app window closes!
        for proc in (django_proc, adc_proc):
            if proc and proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except Exception:
                    proc.kill()


if __name__ == "__main__":
    main()
