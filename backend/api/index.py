import os
import sys

# Ensure backend directory is in sys.path so modules in backend/ are importable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

