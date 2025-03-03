
from os.path import dirname, abspath

class DummyTest(
    name='DummyTest',
    description='Dummy test',
):
    
    def test_dummy(self):
        assert 1 == 1