from datetime import datetime

def log(msg):
	dt = datetime.utcnow().isoformat()
	print(f"{dt}Z {msg}")