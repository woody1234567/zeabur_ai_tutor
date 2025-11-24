import { db } from "../../db";
import { problems } from "../../db/schema";

export default defineEventHandler(async () => {
  const existing = await db.select().from(problems).limit(1);
  if (existing.length > 0) {
    return { message: "Database already seeded" };
  }

  await db.insert(problems).values([
    {
      title: "Newton's Second Law",
      content:
        "A force of 20 N acts on a mass of 4 kg. What is the acceleration of the object?",
      choices: {
        A: "2 m/s²",
        B: "5 m/s²",
        C: "80 m/s²",
        D: "0.2 m/s²",
      },
      correctAnswer: "B",
      explanation:
        "According to Newton's Second Law, F = ma. Therefore, a = F/m. a = 20 N / 4 kg = 5 m/s².",
      difficulty: "Easy",
      source: "Physics 101",
    },
    {
      title: "Projectile Motion",
      content:
        "A ball is thrown horizontally from a cliff with a velocity of 10 m/s. Ignoring air resistance, what is its horizontal velocity after 2 seconds?",
      choices: {
        A: "0 m/s",
        B: "10 m/s",
        C: "20 m/s",
        D: "9.8 m/s",
      },
      correctAnswer: "B",
      explanation:
        "In projectile motion, horizontal velocity remains constant if we ignore air resistance. Gravity only affects vertical velocity.",
      difficulty: "Medium",
      source: "Kinematics Quiz",
    },
  ]);

  return { message: "Seeded 2 problems" };
});
