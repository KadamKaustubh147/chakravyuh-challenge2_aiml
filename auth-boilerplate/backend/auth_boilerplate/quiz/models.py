from django.db import models
from django.contrib.auth import get_user_model

# Create your models here.

User = get_user_model()

class Quiz(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    user_answer1 = models.CharField(blank=True, null=True)
    is_correct1 = models.BooleanField(blank=True, null=True)  # True if correct
    user_answer2 = models.CharField(blank=True, null=True)
    is_correct2 = models.BooleanField(blank=True, null=True)  # True if correct

    def __str__(self):
        return f"{self.user.username}"