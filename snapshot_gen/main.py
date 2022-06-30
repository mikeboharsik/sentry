import cv2
import numpy
import picamera

import sys, os
import pathlib
import datetime
import io
import json
import shutil
import time
import traceback

from scripts.config import ConfigManager
from scripts.log import LogManager

logManager = LogManager('/home/pi/temp/sentry/log')
log = logManager.log

lastRequestProcessingTime = None

def processArguments():
	burst = False
	continuous = False
	rapid = False
	updateBase = False

	for idx, arg in enumerate(sys.argv):
		if arg == 'cont':
			continuous = True
		elif arg == 'rapid':
			rapid = True
		elif arg == 'base':
			updateBase = True
		elif arg == 'burst':
			burst = True

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

def benchmark(func, desc = None, configManager = None):
	log = configManager.log

	t1 = datetime.datetime.utcnow()
	func()	
	t2 = datetime.datetime.utcnow()

	out = f"Total time: {t2 - t1}"
	if desc:
		out += f" ({desc})"

	log(out)

def currentTimeFileName():
	return datetime.datetime.utcnow().strftime('%Y-%m-%dZ%H-%M-%S-%f.jpg')

def snapshots(pathSnapshots, camera, continuous = False, name = "temp", arguments = {}, configuration = {}, configManager = None):
	log = configManager.log

	burst = arguments['burst']
	continuous = arguments['continuous']
	rapid = arguments['rapid']

	outSize = (configuration['outputWidth'], configuration['outputHeight'])
	pathBaseImage = configuration['pathBaseImage']
	pathSnapshots = configuration['pathSnapshots']
	quality = configuration['quality']
	tolerance = configuration['tolerance']

	baseSum = configManager.get(['baseSum'])

	stream = io.BytesIO()

	for frame in camera.capture_continuous(stream, format='jpeg', resize = outSize, quality = quality, use_video_port = rapid, burst = burst):
		if configuration['isPaused']:
			streambytes = None
			frame.seek(0)
			frame.truncate() # avoid memory 'leak'
		else:
			frame.seek(0)
			streambytes = frame.read()
			frame.seek(0)

			bytes = numpy.asarray(bytearray(streambytes), numpy.uint8)
			img = cv2.imdecode(bytes, cv2.IMREAD_COLOR)
			sum = imgsum(img, configuration)
			
			diff = abs(baseSum - sum)
			percent = diff / baseSum
			save = percent > tolerance
			
			log(f"baseSum {baseSum}, sum {sum}, percent {percent}, tolerance {tolerance}, save {save}")

			frame.truncate()		
			
			if not continuous or save:
				if name == "temp":
					final = f"{pathSnapshots}/{currentTimeFileName()}"
				else:
					final = pathBaseImage
				
				with open(final, 'wb') as f:
					f.write(streambytes)
				
				log(f"Saved snapshot {final!r} with a difference of {percent}")
				
				if not save:
					break
		
		configuration = configManager.process(streambytes)
		if configuration['requests']['reinitialize']:
			break

	return {
		'lastSum': sum
	}
				
def main(dirRoot = '/home/pi/temp/sentry', skipSleep = False, overrides = {}):
	logManager = LogManager(dirRoot)
	log = logManager.log

	log("==========	Starting up	==========")

	configManager = ConfigManager(dirRoot, logManager, overrides = overrides)

	configuration = {}
	arguments = {}

	configuration = configManager.process()

	pathBaseImage = configuration['pathBaseImage']
	pathSnapshots = configuration['pathSnapshots']

	if (not os.path.isdir(pathSnapshots)):
		pathlib.Path(pathSnapshots).mkdir(parents = True, exist_ok = True)
		log(f"Created '{pathSnapshots}'")

	baseImageMissing = False
	if (not os.path.isfile(pathBaseImage)):
		baseImageMissing = True

	arguments = processArguments()

	reinitialize = True

	while reinitialize:
		reinitialize = configManager.set(['requests', 'reinitialize', False])

		log("Initializing camera...")

		with picamera.PiCamera() as camera:
			log("Camera initalized")

			try:
				cameraSettings = configManager.get(['cameraSettings'])
				log(f"Initializing camera settings from {cameraSettings}")

				awbMode = cameraSettings['awbMode']
				crop = cameraSettings['crop']
				exposureMode = cameraSettings['exposureMode']
				framerate = cameraSettings['framerate']
				iso = cameraSettings['iso']
				res = cameraSettings['res']
				rotation = cameraSettings['rotation']
				shutterSpeed = cameraSettings['shutterSpeed']

				camera.resolution = res
				camera.rotation = rotation
				camera.crop = crop
				camera.framerate = framerate
				camera.iso = iso

				if not skipSleep:
					log("Sleeping 2 seconds")
					time.sleep(2)

				camera.shutter_speed = shutterSpeed
				camera.exposure_mode = exposureMode
				g = camera.awb_gains
				camera.awb_mode = awbMode
				camera.awb_gains = g

				camera.start_preview()

				log("Started camera preview")

				if (baseImageMissing):
					log("Base image missing")
					res = snapshots(pathSnapshots, camera, name = "base", arguments = arguments, configuration = configuration, configManager = configManager)
					lastSum = int(res['lastSum'])
					configManager.set(['baseSum', lastSum])
					shutil.copyfile(pathBaseImage, f"{pathSnapshots}/{currentTimeFileName()}")
					log(f"Initiated base image and copied into '{pathSnapshots}' with '{lastSum}'")
				
				try:
					baseSum = imgsum(cv2.imread(pathBaseImage, cv2.IMREAD_COLOR), configuration)
				except:
					log("Failed to get baseSum")
					baseSum = -1

				if baseSum != configuration['baseSum']:
					log(F"Updating baseSum config value to {baseSum}")
					configManager.set(['baseSum', int(baseSum)])
				
				continuous = arguments['continuous']
				updateBase = arguments['updateBase']

				if continuous:
					log("Entering snapshot loop")
					snapshots(pathSnapshots, camera, True, baseSum = baseSum, configuration = configuration, arguments = arguments, configManager = configManager)

					configuration = configManager.process()
					if configManager.get(['requests', 'reinitialize']):
						reinitialize = True
				else:
					if updateBase:
						benchmark(lambda: snapshots(pathSnapshots, camera, name = "base", configuration = configuration, arguments = arguments, configManager = configManager), configManager = configManager)
					else:
						benchmark(lambda: snapshots(pathSnapshots, camera, configuration = configuration, arguments = arguments, configManager = configManager), configManager = configManager)
			
			except:
				log(f"\nException info 1: {sys.exc_info()[0]}\nException info 2: {sys.exc_info()[1]}\nException traceback: {traceback.print_tb(sys.exc_info()[2])}")
				
			finally:
				camera.stop_preview()

if __name__ == "__main__":
	try:
		main()
	finally:
		log("========== Shutting down ==========")
