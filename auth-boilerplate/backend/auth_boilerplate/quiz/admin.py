from django.contrib import admin
from .models import Quiz



    # user = models.ForeignKey(User, on_delete=models.CASCADE)
    # user_answer1 = models.CharField(blank=True, null=True)
    # is_correct1 = models.BooleanField(blank=True, null=True)  # True if correct
    # user_answer2 = models.CharField(blank=True, null=True)
    # is_correct2 = models.BooleanField(blank=True, null=True)  # True if correct

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_answer1', 'is_correct1', 'user_answer2', 'is_correct2')