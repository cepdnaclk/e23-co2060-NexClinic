import sys
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

import django
django.setup()

from django.test.runner import DiscoverRunner

def run(labels):
    runner = DiscoverRunner(verbosity=2, interactive=False, keepdb=True)
    # Use DiscoverRunner.run_tests which performs setup/teardown internally
    failures = runner.run_tests(labels)

    if failures:
        sys.exit(bool(failures))

if __name__ == '__main__':
    # Default to hospital tests
    labels = sys.argv[1:] or ['hospital']
    run(labels)
