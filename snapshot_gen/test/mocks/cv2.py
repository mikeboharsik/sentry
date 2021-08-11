class CVMock:
	def __init__(self):
		self.IMREAD_COLOR = "IMREAD_COLOR"

	def imdecode(self, bytes, format):
		return bytearray([])

	def imread(self, bytes, format):
		return bytearray([])
	