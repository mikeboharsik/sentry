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

pathSnapshots = './snapshots'
pathBase = './base.jpg'
pathConfig = './config.json'

w = int(1920)
h = int(1080)
res = (w, h)

crop = (0.2, 0.255, 0.7, 0.4)
outWidth = int(res[0] * crop[3])
outHeight = int(res[1] * crop[2])
outSize = (outWidth, outHeight)

decimationX = 12
decimationY = 12

baseSum = 0
tolerance = 0.05
quality = 100

continuous = False
rapid = False
updateBase = False
burst = False

lastRequestProcessingTime = None
requestProcessingIntervalSeconds = 5

def log(msg):
  dt = str(datetime.datetime.utcnow()).replace(' ', 'T')
  print(f"{dt}Z {msg}")

samplesX = int(outWidth / decimationX)
samplesY = int(outHeight / decimationY)

log(f"Decimation settings result in {samplesX} X samples and {samplesY} Y samples ({samplesX * samplesY} total)")
log(f"Reading {pathConfig} at a rate of {requestProcessingIntervalSeconds} seconds")

def processArguments():
  global continuous, rapid, updateBase, burst

  try:
    if sys.argv.index('cont') >= 0:
      continuous = True
  except:
    pass
  log(f"Continuous mode: {continuous!r}")

  try:
    if sys.argv.index('rapid') >= 0:
      rapid = True
  except:
    pass
  log(f"Rapid mode: {rapid!r}")

  try:
    if sys.argv.index('base') >= 0:
      updateBase = True
  except:
    pass
  log(f"Update base: {updateBase!r}")

  try:
    if sys.argv.index('burst') >= 0:
      burst = True
  except:
    pass
  log(f"Burst: {burst!r}")

def processConfig(streambytes = None, sum = 0, captureDelta = datetime.timedelta(0), sumDelta = datetime.timedelta(0)):
  global baseSum, decimationX, decimationY, lastRequestProcessingTime, pathBase, pathConfig, requestProcessingIntervalSeconds, tolerance

  delta = datetime.timedelta(0)

  if lastRequestProcessingTime:
    delta = datetime.datetime.utcnow() - lastRequestProcessingTime
    
  if not lastRequestProcessingTime or delta.seconds >= requestProcessingIntervalSeconds:
    config = None
    f = open(pathConfig)  
    try:
      config = json.loads(f.read())
    finally:
      f.close()
      f = None
      
    config["lastRead"] = str(datetime.datetime.utcnow())
    config["lastCaptureDelta"] = str(captureDelta)
    config["lastSumDelta"] = str(sumDelta)
    
    if config["lastBaseSum"] != baseSum and baseSum != 0:
      lastBaseSumBefore = config["lastBaseSum"]
      config["lastBaseSum"] = int(baseSum)
      log(f"Updated lastBaseSum from {lastBaseSumBefore} to {config['lastBaseSum']}")
    
    if config["decimationX"] != decimationX:
      decimationXBefore = decimationX
      decimationX = config["decimationX"]
      log(f"Updated decimationX from {decimationXBefore} to {decimationX}")
      
    if config["decimationY"] != decimationY:
      decimationYBefore = decimationY
      decimationY = config["decimationY"]
      log(f"Updated decimationY from {decimationYBefore} to {decimationY}")
    
    if config["requestProcessingIntervalSeconds"] != requestProcessingIntervalSeconds:
      requestProcessingIntervalSecondsBefore = requestProcessingIntervalSeconds
      requestProcessingIntervalSeconds = config["requestProcessingIntervalSeconds"]
      log(f"Updated requestProcessingIntervalSeconds from {requestProcessingIntervalSecondsBefore} to {requestProcessingIntervalSeconds}")
      
    if config["tolerance"] != tolerance:
      toleranceBefore = tolerance
      tolerance = config["tolerance"]
      log(f"Updated tolerance from {toleranceBefore} to {tolerance}")
    
    requests = config["requests"]
    if requests["updateBase"] and streambytes:
      f = open(pathBase, 'wb')
      try:
        f.write(streambytes)
      finally:
        f.close()
      requests["updateBase"] = False
      baseSum = sum
      log(f"Updated {pathBase} and set baseSum to {baseSum}")
      
    f = open(pathConfig, 'w')
    try:
      f.write(json.dumps(config, indent = 2, sort_keys = True))
    finally:
      f.close()
      
    lastRequestProcessingTime = datetime.datetime.utcnow()

def imgsum(img):
  global decimationX, decimationY

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

def snapshots(camera, continuous = False, name = "temp", baseSum = -1):
  global pathSnapshots

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
    sum = imgsum(img)
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
      
      f = open(final, 'wb')
      try:
        f.write(streambytes)
      finally:
        f.close()
      
      log(f"Saved snapshot {final!r} with a difference of {percent}")
      
      if not save:
        break
        
    processConfig(streambytes, sum, capture_end - capture_start, sum_end - sum_start)
    
    capture_start = capture_end = datetime.datetime.utcnow()
        
def main():
  global baseSum, continuous, pathBase, res, crop

  if (not os.path.isdir(pathSnapshots)):
    os.mkdir(pathSnapshots)
    log(f"Created '{pathSnapshots}'")

  if (not os.path.isfile(pathBase)):
    baseImageMissing = True

  processArguments()
  processConfig()

  log("Initializing camera...")
  reassure = True
  with picamera.PiCamera() as camera:
    if reassure:
      log("Camera initalized")
      reassure = False

    try:
      camera.resolution = res
      camera.rotation = 90
      camera.crop = crop
      camera.framerate = 60
      camera.iso = 320
      time.sleep(2)
      camera.shutter_speed = 16000
      camera.exposure_mode = 'off'
      g = camera.awb_gains
      camera.awb_mode = 'off'
      camera.awb_gains = g
      camera.start_preview()

      if (baseImageMissing):
        snapshots(camera, name = "base")
        shutil.copyfile(pathBase, f"{pathSnapshots}/{currentTimeFileName()}")
        log(f"Initiated base image and copied into '{pathSnapshots}'")
      
      try:
        baseSum = imgsum(cv2.imread(pathBase, cv2.IMREAD_COLOR))
      except:
        baseSum = -1
      
      if continuous:
        snapshots(camera, True, baseSum = baseSum)
      else:
        if updateBase:
          benchmark(lambda: snapshots(camera, name = "base"))
        else:
          benchmark(lambda: snapshots(camera))
    
    except:
      log(sys.exc_info()[0])
      log(sys.exc_info()[1])
      log(sys.exc_info()[2])
      
    finally:
      camera.stop_preview()
      
main()