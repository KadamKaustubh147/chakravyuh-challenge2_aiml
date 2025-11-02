from django.http import JsonResponse

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from accounts.authentication import CustomJWTAuthentication
from .models import Quiz


class QuizGetView(APIView):
    """
    GET: Returns a riddle for the authenticated user.
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        quiz = Quiz.objects.filter(user=request.user).first()
        if not quiz:
            return Response({"error": "No quiz found for this user."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"riddle": quiz.riddle}, status=status.HTTP_200_OK)




# views.py

# Define correct answers (lowercase)
CORRECT_ANSWERS = {
    1: "54",                # riddle1
    2: "mainak thakur",     # riddle2
}

# Lock durations (ms) — backend returns these for frontend convenience
LOCK_DURATIONS_MS = {
    1: 3 * 60 * 1000,        # 3 minutes
    2: int(1.5 * 60 * 1000), # 1.5 minutes
}

class QuizSubmitView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Expects JSON:
        {
          "riddle": 1 or 2,
          "user_answer": "..."
        }
        """
        user = request.user
        data = request.data

        try:
            riddle = int(data.get("riddle"))
        except (TypeError, ValueError):
            return Response({"detail": "Invalid or missing riddle id."}, status=status.HTTP_400_BAD_REQUEST)

        user_answer = (data.get("user_answer") or "").strip().lower()

        # get or create user's quiz row
        quiz, _ = Quiz.objects.get_or_create(user=user)

        # If riddle 2, first ensure riddle1 is correct
        if riddle == 2:
            if not quiz.is_correct1:
                # Not allowed to attempt riddle 2
                return Response({
                    "allowed": False,
                    "reason": "Riddle 1 not solved yet.",
                    "is_correct": False
                }, status=status.HTTP_200_OK)

            # Proceed to check riddle2
            correct_answer = CORRECT_ANSWERS[2]
            is_correct = (user_answer == correct_answer)

            # Save riddle2 answer + correctness
            quiz.user_answer2 = user_answer
            quiz.is_correct2 = is_correct
            quiz.save()

            if not is_correct:
                # return lock duration so frontend can set localStorage timer
                return Response({
                    "allowed": True,
                    "is_correct": False,
                    "lock_duration_ms": LOCK_DURATIONS_MS[2],
                    "message": "Wrong answer for riddle 2."
                }, status=status.HTTP_200_OK)

            return Response({
                "allowed": True,
                "is_correct": True,
                "message": "Correct!"
            }, status=status.HTTP_200_OK)

        elif riddle == 1:
            # Check riddle1
            correct_answer = CORRECT_ANSWERS[1]
            is_correct = (user_answer == correct_answer)

            # Save riddle1 answer + correctness
            quiz.user_answer1 = user_answer
            quiz.is_correct1 = is_correct
            quiz.save()

            if not is_correct:
                return Response({
                    "allowed": True,
                    "is_correct": False,
                    "lock_duration_ms": LOCK_DURATIONS_MS[1],
                    "message": "Wrong answer for riddle 1."
                }, status=status.HTTP_200_OK)

            return Response({
                "allowed": True,
                "is_correct": True,
                "message": "Correct! You can now attempt riddle 2."
            }, status=status.HTTP_200_OK)

        else:
            return Response({"detail": "Unknown riddle id."}, status=status.HTTP_400_BAD_REQUEST)


def health(request):
    return JsonResponse({"status": "ok"}, status=200)