class MockFrame:
	def seek(self, pos):
		return

	def truncate(self):
		return

	def read(self):
		with open('./test/mocks/16.jpg', 'rb') as f:
			a = bytearray(f.read())
			return a

class PiCameraMock:
	class MockMock:
		def __init__(self):
			self.awb_gains = {}
		def __enter__(self):
			return self
		def __exit__(self, type, val, tb):
			return

		def start_preview(self):
			return
		def stop_preview(self):
			return
		def capture_continuous(self, stream, format, resize, quality, use_video_port, burst):
			return [MockFrame()]

	def PiCamera(self):
		return self.MockMock()
