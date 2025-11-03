import { useEffect, useState } from "react";
import api from "../AxiosInstance";
import bgImage from "./bg.webp"; // your background image path

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
    title: "Riddle 2",
    text: `I stand with a foot in two different worlds.
One is a silent fortress, built of pure reason,
Where theorems stand like stone and logic is the only season.
My scholars there speak in ∫ and ∀.

The other is a roaring, digital sea,
Where my explorers hunt for the patterns of what will be,
Wielding the algorithms that see through the noise.

I do not chart the course, nor build the proof myself,
But my voice is the one that sets these minds in motion.
I am the living nexus, the hand that guides the hands of both.
I cultivate the thinkers, not just the thoughts.`,
  },
];

const RiddleQuiz = () => {
  const [currentRiddle, setCurrentRiddle] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ✅ Restore cooldown timer
  useEffect(() => {
    const endTime = localStorage.getItem("cooldownEndTime");
    if (endTime) {
      const remaining = Math.floor((parseInt(endTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
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

  // Format timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown) return;

    const riddle = riddles[currentRiddle];

    try {
      const res = await api.post("/quiz/question_submit/", {
        riddle: riddle.id,
        user_answer: answer.toLowerCase().trim(),
      });

      const data = res.data;

      if (data.is_correct) {
        setFeedback("✅ Submitted successfully!");
        setSubmitted(true);
        setCooldown(null);
        localStorage.removeItem("cooldownEndTime");
      }  else {
  // ❌ Wrong answer
  // backend sends cooldown in milliseconds
  const waitTimeMs = data.cooldown || 30000; // fallback to 30s if not provided
  const waitTimeSec = Math.floor(waitTimeMs / 1000);

  const endTime = Date.now() + waitTimeMs;
  localStorage.setItem("cooldownEndTime", endTime.toString());
  setCooldown(waitTimeSec);
  setFeedback("❌ Submitted successfully! (You can retry after timer)");

  const interval = setInterval(() => {
    setCooldown((prev) => {
      if (prev && prev > 1) return prev - 1;
      clearInterval(interval);
      localStorage.removeItem("cooldownEndTime");
      setFeedback("");
      return null;
    });
  }, 1000);
}

    } catch (error) {
      setFeedback("Submission failed!");
    }
  };

  const handleNext = () => {
    if (currentRiddle < riddles.length - 1) {
      setCurrentRiddle(currentRiddle + 1);
      setAnswer("");
      setFeedback("");
      setSubmitted(false);
      setCooldown(null);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="max-w-2xl w-full bg-black/60 backdrop-blur-md rounded-2xl p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-lg">
          {riddles[currentRiddle].title}
        </h1>

        {/* Preserve line breaks */}
        <p className="text-lg mb-6 text-gray-100 whitespace-pre-line leading-relaxed">
          {riddles[currentRiddle].text}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!!cooldown}
            className="border border-gray-400 rounded-lg p-3 text-center text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
            required
          />

          <button
            type="submit"
            disabled={!!cooldown}
            className={`px-4 py-2 rounded-lg font-semibold text-white transition ${
              cooldown
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {cooldown ? `Wait (${formatTime(cooldown)})` : "Submit"}
          </button>
        </form>

        {feedback && (
          <p
            className={`mt-4 text-sm ${
              feedback.includes("✅") ? "text-green-400" : "text-red-400"
            }`}
          >
            {feedback}
          </p>
        )}

        {currentRiddle < riddles.length - 1 && (
          <button
            onClick={handleNext}
            disabled={!submitted}
            className={`mt-6 px-5 py-2 rounded-lg font-semibold transition ${
              submitted
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            {submitted ? "Next Riddle ✅" : "Next Riddle (Locked)"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RiddleQuiz;
