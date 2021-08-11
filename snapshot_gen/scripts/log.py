import pathlib
from datetime import datetime

class LogManager:
	def __init__(self, logDir):
		self.logDir = logDir

	def log(self, msg, omitNewline = False):
		pathlib.Path(self.logDir).mkdir(parents = True, exist_ok = True)

		with open(f'{self.logDir}/log.txt', 'a') as f:
			dt = datetime.utcnow().isoformat()
			logMsg = f"{dt}Z {msg}" 

			if omitNewline:
				eol = ''
			else:
				eol = '\n'

			final = f"{logMsg}{eol}"

			print(final, end = '')
			f.write(final)
