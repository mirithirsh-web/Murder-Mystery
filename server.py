#!/usr/bin/env python3
"""Dev server with no-cache headers so the browser always gets fresh files."""
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Serve files from this script's directory (not the shell's cwd).
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

HTTPServer(('0.0.0.0', 8081), NoCacheHandler).serve_forever()
