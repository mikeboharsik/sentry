import shutil

import unittest
from unittest.mock import patch

import test.mocks.all_mocks

testingDir = './__testing__'

class TestMain(unittest.TestCase):
	@classmethod
	def setUpClass(self):
		try:
			shutil.rmtree(testingDir)
		except:
			pass

	def test_main(self):
		overrides = {
			'outputHeight': 16,
			'outputWidth': 16,
		}

		main(testingDir, True, overrides)

	@classmethod
	def tearDownClass(self):
		pass #shutil.rmtree(testingDir)

from main import main

if __name__ == "__main__":
	unittest.main()