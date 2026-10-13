"""Compatibility entry point for PirateGold narration."""
import subprocess
import sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(root / 'scripts/prepare-voice.py'), 'PirateGold', *sys.argv[1:]],
               cwd=root, check=True)
