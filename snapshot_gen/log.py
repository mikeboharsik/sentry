from datetime import datetime

def log(msg):
  dt = str(datetime.utcnow()).replace(' ', 'T')
  print(f"{dt}Z {msg}")