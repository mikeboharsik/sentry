import datetime
import json
import os
import pathlib

class ConfigManager:
	def __init__(self, dirRoot = '/home/pi/temp/sentry', logManager = None, overrides = {}):
		self.log = logManager.log
		self.dirRoot = dirRoot
		self.dirSnapshots = f'{self.dirRoot}/snapshots'
		self.dirBaseImage = f'{self.dirRoot}'
		self.fileNameBaseImage = 'base.jpg'
		self.pathBaseImage = f'{self.dirBaseImage}/{self.fileNameBaseImage}'

		self.seed(overrides)

	def getConfigPath(self):
		return f'{self.dirRoot}/config.json' 

	def getDefaultRes(self):
		defaultHeight = 1080
		defaultWidth = 1920

		return (defaultWidth, defaultHeight)

	def getDefaultCameraSettings(self):
		defaultAwbMode = 'off'
		defaultCrop = (0.185, 0.3625, 0.7, 0.4)
		defaultExposureMode = 'off'
		defaultFramerate = 60
		defaultIso = 320
		defaultRotation = 90
		defaultShutterSpeed = 16000

		return {
			'awbMode': defaultAwbMode,
			'crop': defaultCrop,
			'exposureMode': defaultExposureMode,
			'framerate': defaultFramerate,
			'iso': defaultIso,
			'res': self.getDefaultRes(),
			'rotation': defaultRotation,
			'shutterSpeed': defaultShutterSpeed,
		}

	def getDefaultConfig(self):
		defaultCameraSettings = self.getDefaultCameraSettings()

		defaultCrop = defaultCameraSettings['crop']
		defaultRes = defaultCameraSettings['res']

		defaultHeight = defaultRes[1]
		defaultWidth = defaultRes[0]

		defaultBaseSum = 0
		defaultDecimationX = 8
		defaultDecimationY = 8
		defaultQuality = 100
		defaultRequestProcessingIntervalSeconds = 5
		defaultTolerance = 0.08

		return {
			'baseSum': defaultBaseSum,
			'cameraSettings': defaultCameraSettings,
			'decimationX': defaultDecimationX,
			'decimationY': defaultDecimationY,
			'height': defaultHeight,
			'isPaused': False,
			'lastRequestProcessingTime': 0,
			'outputHeight': int(defaultRes[1] * defaultCrop[2]),
			'outputWidth': int(defaultRes[0] * defaultCrop[3]),
			'pathBaseImage': self.pathBaseImage,
			'pathSnapshots': self.dirSnapshots,
			'quality': defaultQuality,
			'requestProcessingIntervalSeconds': defaultRequestProcessingIntervalSeconds,
			'requests': {
				'reinitialize': False,
				'updateBase': False,
			},
			'tolerance': defaultTolerance,
			'width': defaultWidth,
		}

	def seed(self, overrides = {}):
		pathlib.Path(self.dirRoot).mkdir(parents = True, exist_ok = True)
		pathConfig = self.getConfigPath()

		try:
			with open(pathConfig) as f:
				try:
					json.loads(f.read())
					self.log(f"Verified that '{pathConfig}' exists, not seeding")
				except:
					self.log("Config file exists but could not be parsed, replacing with default")
					os.rename(pathConfig, f"{pathConfig}.bad")
					raise FileNotFoundError
		except FileNotFoundError:
			with open(pathConfig, 'w') as f:
				defaultConfig = self.getDefaultConfig()

				for key in overrides.keys():
					val = overrides[key]	
					defaultConfig[key] = val
					self.log(f'Overrode default "{key}" with "{val}"')

				fileContent = json.dumps(defaultConfig, indent = 2, sort_keys = True)
				f.write(fileContent)

				self.log(f"Seeded '{pathConfig} with default settings")

	def process(self, streambytes = None):
		pathConfig = self.getConfigPath()

		updatedConfig = {}
		with open(pathConfig) as f:
			updatedConfig = json.loads(f.read())

		delta = datetime.timedelta(0)

		lastRequestProcessingTime = updatedConfig['lastRequestProcessingTime']
		if lastRequestProcessingTime:
			delta = datetime.datetime.utcnow() - datetime.datetime.strptime(lastRequestProcessingTime, '%Y-%m-%dT%H:%M:%S.%f')

		requestProcessingIntervalSeconds = updatedConfig['requestProcessingIntervalSeconds']
			
		if not lastRequestProcessingTime or delta.seconds >= requestProcessingIntervalSeconds:
			if updatedConfig == {}:
				self.log(f"Failed to load '{pathConfig}'")
				return

		updatedConfig['lastRead'] = str(datetime.datetime.utcnow())
			
		with open(pathConfig, 'w') as f:
			f.write(json.dumps(updatedConfig, indent = 2, sort_keys = True))

		return updatedConfig

	def get(self, prop):
		pathConfig = self.getConfigPath()

		updatedConfig = {}

		with open(pathConfig) as f:
			updatedConfig = json.loads(f.read())

		curVal = updatedConfig
		for i in range(len(prop)):
			curVal = curVal[prop[i]]

		return curVal

	def set(self,  val):
		pathConfig = self.getConfigPath()

		updatedConfig = {}

		with open(pathConfig) as f:
			updatedConfig = json.loads(f.read())

		curOb = updatedConfig
		for i in range(len(val) - 2):
			curOb = curOb[val[i]]

		curOb[val[-2]] = val[-1]

		with open(pathConfig, 'w') as f:
			f.write(json.dumps(updatedConfig, indent = 2, sort_keys = True))

		return val[-1]