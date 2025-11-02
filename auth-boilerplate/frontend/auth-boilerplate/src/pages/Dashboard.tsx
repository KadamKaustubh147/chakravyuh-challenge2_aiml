import { useEffect, useState } from "react";
import api from "../AxiosInstance";

const CubeMystery = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const riddleId = 1; // Cube Mystery

  // Helper: check if locked and calculate remaining time
  const checkLock = () => {
    const timer = localStorage.getItem(`timer_riddle${riddleId}`);
    if (!timer) {
      setRemainingTime(0);
      return false;
    }

    const unlockTime = parseInt(timer);
    const diff = unlockTime - Date.now();

    if (diff <= 0) {
      localStorage.setItem(`timeOver_riddle${riddleId}`, "true");
      localStorage.removeItem(`timer_riddle${riddleId}`);
      setRemainingTime(0);
      return false;
    }

    setRemainingTime(diff);
    return true;
  };

  useEffect(() => {
    // Fetch question once
    const fetchQuestion = async () => {
      try {
        const res = await api.get("/quiz/questions/");
        setQuestion(res.data.riddle); // backend should send {riddle: "..."}
      } catch (error) {
        console.error("Error fetching question:", error);
      }
    };

    fetchQuestion();

    // Check lock initially and update every second
    setIsLocked(checkLock());
    const interval = setInterval(() => {
      const locked = checkLock();
      setIsLocked(locked);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format ms → mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      setFeedback("⏳ Please wait until the lock period is over.");
      return;
    }

    try {
      const res = await api.post("/quiz/submit/", {
        riddle: riddleId,
        user_answer: answer,
      });

      if (res.status === 200) {
        const { is_correct, lock_duration_ms } = res.data;

        setFeedback("✅ Submitted successfully!");

        // If wrong, lock the user for 3 min (or backend-provided time)
        if (is_correct === false) {
          const lockMs = lock_duration_ms || 3 * 60 * 1000; // default 3min
          const unlockTime = Date.now() + lockMs;

          localStorage.setItem(`timer_riddle${riddleId}`, unlockTime.toString());
          localStorage.setItem(`timeOver_riddle${riddleId}`, "false");
          localStorage.setItem(`isCorrect_riddle${riddleId}`, "false");

          setRemainingTime(lockMs);
          setIsLocked(true);
        } else {
          localStorage.setItem(`isCorrect_riddle${riddleId}`, "true");
        }
      }
    } catch (error: any) {
      console.error(error);
      setFeedback("Submission failed!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <h1 className="text-2xl font-bold mb-4">The Cube Mystery</h1>
      <p className="text-center mb-4 max-w-md">{question}</p>

      <form onSubmit={submitAnswer} className="flex flex-col items-center gap-2">
        <input
          type="text"
          placeholder="Enter your answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="text-white bg-gray-800 rounded px-3 py-2 w-64"
          disabled={isLocked}
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded ${
            isLocked ? "bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
          disabled={isLocked}
        >
          Submit
        </button>
      </form>

      {isLocked && (
        <div className="mt-4 text-red-400">
          ⏳ Locked! Try again in{" "}
          <span className="font-bold text-yellow-400">
            {formatTime(remainingTime)}
          </span>
        </div>
      )}

      {feedback && <p className="mt-3 text-yellow-400">{feedback}</p>}
    </div>
  );
};

export default CubeMystery;
