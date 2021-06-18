import datetime
import json
import os

# local
from log import log

defaultPathSnapshots = '../../snapshots'
defaultPathBase = './base.jpg'

defaultAwbMode = 'off'
defaultBaseSum = 0
defaultCrop = (0.185, 0.3625, 0.7, 0.4)
defaultDecimationX = 8
defaultDecimationY = 8
defaultExposureMode = 'off'
defaultFramerate = 60
defaultHeight = 1080
defaultIso = 320
defaultQuality = 100
defaultRequestProcessingIntervalSeconds = 5
defaultRotation = 90
defaultShutterSpeed = 16000
defaultTolerance = 0.08
defaultWidth = 1920

defaultRes = (defaultWidth, defaultHeight)

defaultCameraSettings = {
  'awbMode': defaultAwbMode,
  'crop': defaultCrop,
  'exposureMode': defaultExposureMode,
  'framerate': defaultFramerate,
  'iso': defaultIso,
  'res': defaultRes,
  'rotation': defaultRotation,
  'shutterSpeed': defaultShutterSpeed,
}

defaultConfig = {
  'baseSum': defaultBaseSum,
  'cameraSettings': defaultCameraSettings,
  'decimationX': defaultDecimationX,
  'decimationY': defaultDecimationY,
  'height': defaultHeight,
  'isPaused': False,
  'lastRequestProcessingTime': 0,
  'outputHeight': int(defaultRes[1] * defaultCrop[2]),
  'outputWidth': int(defaultRes[0] * defaultCrop[3]),
  'pathBase': defaultPathBase,
  'pathSnapshots': defaultPathSnapshots,
  'quality': defaultQuality,
  'requestProcessingIntervalSeconds': defaultRequestProcessingIntervalSeconds,
  'requests': {
    'reinitialize': False,
    'updateBase': False,
  },
  'tolerance': defaultTolerance,
  'width': defaultWidth,
}

def seed(pathConfig):
  try:
    with open(pathConfig) as f:
      try:
        json.loads(f.read())
        log(f"Verified that '{pathConfig}' exists, not seeding")
      except:
        log("Config file exists but could not be parsed, replacing with default")
        os.rename(pathConfig, f"{pathConfig}.bad")
        raise FileNotFoundError
  except FileNotFoundError:
    with open(pathConfig, 'w') as f:
      fileContent = json.dumps(defaultConfig, indent = 2, sort_keys = True)
      f.write(fileContent)

      log(f"Seeded '{pathConfig} with default settings")

def process(pathConfig, streambytes = None):
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
      log(f"Failed to load '{pathConfig}'")
      return

  updatedConfig['lastRead'] = str(datetime.datetime.utcnow())
    
  with open(pathConfig, 'w') as f:
    f.write(json.dumps(updatedConfig, indent = 2, sort_keys = True))

  return updatedConfig

def get(pathConfig, prop):
  updatedConfig = {}

  with open(pathConfig) as f:
    updatedConfig = json.loads(f.read())

  curVal = updatedConfig
  for i in range(len(prop)):
    curVal = curVal[prop[i]]

  return curVal

def set(pathConfig, val):
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