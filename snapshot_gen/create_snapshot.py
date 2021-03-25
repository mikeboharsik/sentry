import cv2
import datetime
import io
import json
import numpy
import os
import picamera
import shutil
import sys
import time
import traceback

# local
import config
from log import log

pathConfig = '../config.json'

lastRequestProcessingTime = None

def processArguments():
  burst = False
  continuous = False
  rapid = False
  updateBase = False

  try:
    if sys.argv.index('cont') >= 0:
      continuous = True
  except:
    pass

  try:
    if sys.argv.index('rapid') >= 0:
      rapid = True
  except:
    pass

  try:
    if sys.argv.index('base') >= 0:
      updateBase = True
  except:
    pass

  try:
    if sys.argv.index('burst') >= 0:
      burst = True
  except:
    pass

  return {
    'burst': burst,
    'continuous': continuous,
    'rapid': rapid,
    'updateBase': updateBase,
  }

def imgsum(img, config):
  decimationX = config['decimationX']
  decimationY = config['decimationY']

  sum = 0
  for i in range(len(img)):
    if int(i % decimationY) == 0:
      for j in range(len(img[i])):
        if int(j % decimationX) == 0:
          for k in range(0, 3):
            sum += img[i][j][k]
            
  return sum

def benchmark(func, desc = None):
  t1 = datetime.datetime.utcnow()
  func()  
  t2 = datetime.datetime.utcnow()

  out = f"Total time: {t2 - t1}"
  if desc:
    out += f" ({desc})"

  log(out)

def currentTimeFileName():
  return datetime.datetime.utcnow().strftime('%Y-%m-%dZ%H-%M-%S-%f.jpg')

def snapshots(pathSnapshots, camera, continuous = False, name = "temp", baseSum = -1, arguments = {}, configuration = {}):
  burst = arguments['burst']
  continuous = arguments['continuous']
  rapid = arguments['rapid']

  outSize = (configuration['outputWidth'], configuration['outputHeight'])
  pathSnapshots = configuration['pathSnapshots']
  quality = configuration['quality']
  tolerance = configuration['tolerance']

  capture_start = datetime.datetime.utcnow()
  stream = io.BytesIO()

  for frame in camera.capture_continuous(stream, format='jpeg', resize = outSize, quality = quality, use_video_port = rapid, burst = burst):
    frame.seek(0)
    streambytes = frame.read()
    frame.seek(0)
    
    capture_end = datetime.datetime.utcnow()
    
    sum_start = datetime.datetime.utcnow()
    bytes = numpy.asarray(bytearray(streambytes), numpy.uint8)
    img = cv2.imdecode(bytes, cv2.IMREAD_COLOR)
    sum = imgsum(img, configuration)
    sum_end = datetime.datetime.utcnow()
    
    diff = abs(baseSum - sum)
    percent = diff / baseSum
    save = percent > tolerance
    
    frame.truncate()    
    
    if not continuous or save:
      imgname = f"{name}.jpg"
      
      if name == "temp":
        final = f"{pathSnapshots}/{currentTimeFileName()}"
      else:
        final = f"./{imgname}"
      
      with open(final, 'wb') as f:
        f.write(streambytes)
      
      log(f"Saved snapshot {final!r} with a difference of {percent}")
      
      if not save:
        break
    
    configuration = config.process(pathConfig, streambytes)

    capture_start = capture_end = datetime.datetime.utcnow()
        
def main():
  log("==========  Starting up  ==========")

  configuration = {}
  arguments = {}

  config.seed(pathConfig)
  configuration = config.process(pathConfig)

  pathBase = configuration['pathBase']
  pathSnapshots = configuration['pathSnapshots']

  if (not os.path.isdir(pathSnapshots)):
    os.mkdir(pathSnapshots)
    log(f"Created '{pathSnapshots}'")

  baseImageMissing = False
  if (not os.path.isfile(pathBase)):
    baseImageMissing = True

  arguments = processArguments()

  log("Initializing camera...")
  with picamera.PiCamera() as camera:
    log("Camera initalized")

    try:
      log(f"Initializing camera settings from {configuration['cameraSettings']}")

      awbMode = configuration['cameraSettings']['awbMode']
      crop = configuration['cameraSettings']['crop']
      exposureMode = configuration['cameraSettings']['exposureMode']
      framerate = configuration['cameraSettings']['framerate']
      iso = configuration['cameraSettings']['iso']
      res = configuration['cameraSettings']['res']
      rotation = configuration['cameraSettings']['rotation']
      shutterSpeed = configuration['cameraSettings']['shutterSpeed']

      camera.resolution = res
      camera.rotation = rotation
      camera.crop = crop
      camera.framerate = framerate
      camera.iso = iso
      time.sleep(2)
      camera.shutter_speed = shutterSpeed
      camera.exposure_mode = exposureMode
      g = camera.awb_gains
      camera.awb_mode = awbMode
      camera.awb_gains = g

      camera.start_preview()

      if (baseImageMissing):
        snapshots(camera, name = "base")
        shutil.copyfile(pathBase, f"{pathSnapshots}/{currentTimeFileName()}")
        log(f"Initiated base image and copied into '{pathSnapshots}'")
      
      try:
        baseSum = imgsum(cv2.imread(pathBase, cv2.IMREAD_COLOR), configuration)
      except:
        baseSum = -1

      if baseSum != configuration['baseSum']:
        log(F"Updating baseSum config value to {baseSum}")
        config.updateProperty(pathConfig, ['baseSum', int(baseSum)])
      
      continuous = arguments['continuous']
      updateBase = arguments['updateBase']

      if continuous:
        log("Entering snapshot loop")
        snapshots(pathSnapshots, camera, True, baseSum = baseSum, configuration = configuration, arguments = arguments)
      else:
        if updateBase:
          benchmark(lambda: snapshots(pathSnapshots, camera, name = "base", configuration = configuration, arguments = arguments))
        else:
          benchmark(lambda: snapshots(pathSnapshots, camera, configuration = configuration, arguments = arguments))
    
    except:
      log(f"Exception info 1: {sys.exc_info()[0]}")
      log(f"Exception info 2: {sys.exc_info()[1]}")
      log(f"Exception traceback: {traceback.print_tb(sys.exc_info()[2])}")
      
    finally:
      camera.stop_preview()

try:
  main()
finally:
  log("========== Shutting down ==========")