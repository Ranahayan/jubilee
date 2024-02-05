from celery import Celery, Task
from ddtrace import patch
from django.conf import settings  # NOQA
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

patch(celery=True)
app = Celery('core')  # type: Celery


class RetryTask(Task):
    max_retries = 3
    driver = None

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        if self.driver:
            self.driver.quit()
        # try:
        print(exc)
            # self.retry(countdown=self.retry_delay, exc=exc)
        # except MaxRetriesExceededError:
        #     super().on_failure(exc, task_id, args, kwargs, einfo)


app.Task = RetryTask
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.broker_transport_options = {'visibility_timeout': 3600 / 2}  # 1/2 hour.
app.autodiscover_tasks()

# Use the Django Beat Scheduler
app.conf.beat_scheduler = 'django_celery_beat.schedulers:DatabaseScheduler'
