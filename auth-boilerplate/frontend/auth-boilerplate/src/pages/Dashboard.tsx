import { useEffect, useState } from "react";
import api from "../AxiosInstance";

interface Riddle {
  id: number;
  title: string;
  text: string;
}

const riddles: Riddle[] = [
  {
    id: 1,
    title: "Riddle 1",
    text: "I'm made of cubes, both big and small, Some are open, some hide it all. I hold what's wrapped, sealed tight, Awaiting hands to claim their right. Count each block from left to right.",
  },
  {
    id: 2,
    title: "Riddle 2: The Department Head",
    text: "The Department Head",
  },
];

const RiddleQuiz = () => {
  const [currentRiddle, setCurrentRiddle] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // 🔹 Restore cooldown timer on mount
  useEffect(() => {
    const endTime = localStorage.getItem("cooldownEndTime");
    if (endTime) {
      const remaining = Math.floor((parseInt(endTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        setFeedback(`You can try again in ${remaining} seconds`);
        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev && prev > 1) return prev - 1;
            clearInterval(interval);
            localStorage.removeItem("cooldownEndTime");
            setFeedback("");
            return null;
          });
        }, 1000);
      } else {
        localStorage.removeItem("cooldownEndTime");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown) return; // ⛔ prevent resubmission during cooldown

    const riddle = riddles[currentRiddle];

    try {
      await api.post("/quiz/question_submit/", {
        riddle_id: riddle.id,
        user_answer: answer.toLowerCase().trim(),
      });

      setFeedback("Submitted successfully");
      setSubmitted(true);
    } catch (error: any) {
      if (error.response?.status === 429) {
        // 🔹 Server indicates rate limit or cooldown
        const waitTime = error.response?.data?.retry_after || 30;
        const endTime = Date.now() + waitTime * 1000;
        localStorage.setItem("cooldownEndTime", endTime.toString());
        setCooldown(waitTime);
        setFeedback(`You can try again in ${waitTime} seconds`);

        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev && prev > 1) return prev - 1;
            clearInterval(interval);
            localStorage.removeItem("cooldownEndTime");
            setFeedback("");
            return null;
          });
        }, 1000);
      } else {
        setFeedback("Submission failed!");
      }
    }
  };

  const handleNext = () => {
    if (currentRiddle < riddles.length - 1) {
      setCurrentRiddle((prev) => prev + 1);
      setAnswer("");
      setFeedback("");
      setSubmitted(false);
      setCooldown(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">
        {riddles[currentRiddle].title}
      </h1>
      <p className="text-lg mb-4">{riddles[currentRiddle].text}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter your answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="border rounded-lg p-2 text-center text-gray-800 focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          disabled={!!cooldown}
          className={`px-4 py-2 rounded-lg font-semibold text-white ${
            cooldown ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {cooldown ? `Wait ${cooldown}s` : "Submit"}
        </button>
      </form>

      {feedback && (
        <p className="mt-3 text-sm text-gray-700">{feedback}</p>
      )}

      {currentRiddle < riddles.length - 1 && (
        <button
          onClick={handleNext}
          disabled={!submitted}
          className={`mt-4 px-4 py-2 rounded-lg font-semibold transition ${
            submitted
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          {submitted ? "Next unlocked ✅" : "Next Riddle"}
        </button>
      )}
    </div>
  );
};

export default RiddleQuiz;
