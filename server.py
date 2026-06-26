import http.server
import socketserver

PORT = 8080
DIRECTORY = r"C:\Users\ASUS\.gemini\antigravity\scratch\personal_portfolio_site"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving personal portfolio preview at http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
