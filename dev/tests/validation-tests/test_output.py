# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
import subprocess
import pytest
from dev.tests.common.utils import gen_examples, ALL_EXAMPLE_FILES  # pylint: disable=unused-import


@pytest.mark.parametrize('e', ALL_EXAMPLE_FILES)
def test_shellcheck(gen_examples, e):
    subprocess.run(['shellcheck', e], check=True)
