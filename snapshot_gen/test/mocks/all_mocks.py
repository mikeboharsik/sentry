import sys

from test.mocks.cv2 import CVMock
from test.mocks.numpy import NumpyMock
from test.mocks.picamera import PiCameraMock

sys.modules['cv2'] = CVMock()
sys.modules['numpy'] = NumpyMock()
sys.modules['picamera'] = PiCameraMock()