import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Feedback schema
export const feedbackSchema = z.object({
    totalScore: z.number(),
    categoryScores: z.array(
        z.object({
            name: z.string(),
            score: z.number(),
            comment: z.string(),
        })
    ),
    strengths: z.array(z.string()).min(2),
    areasForImprovement: z.array(z.string()).min(2),
    finalAssessment: z.string(),
});

export async function POST(req: Request) {
    try {
        const { interviewId, userId, transcript } = await req.json();

        if (!interviewId || !userId || !transcript) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const formattedTranscript = transcript.map((t: any) => `${t.role}: ${t.content}`).join("\n");

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

        const prompt = `
You are a professional interviewer analyzing a mock interview transcript.
Generate detailed structured feedback **ONLY in pure JSON format** exactly matching this schema:

{
  "totalScore": number (0-100),
  "categoryScores": [
    { "name": "Communication Skills", "score": number (0-10), "comment": string },
    { "name": "Technical Knowledge", "score": number (0-10), "comment": string },
    { "name": "Problem Solving", "score": number (0-10), "comment": string },
    { "name": "Cultural Fit", "score": number (0-10), "comment": string },
    { "name": "Confidence and Clarity", "score": number (0-10), "comment": string }
  ],
  "strengths": [string, string, ...],
  "areasForImprovement": [string, string, ...],
  "finalAssessment": string
}

Rules:
- Output ONLY valid JSON. No explanations, no markdown, no extra text.
- The category names must match EXACTLY as shown.
- Do not include any code block formatting.

Transcript:
${formattedTranscript}
`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text().trim();
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

        const parsed = JSON.parse(rawText);
        const feedback = feedbackSchema.parse(parsed);

        const docRef = await addDoc(collection(db, "feedback"), {
            interviewId,
            userId,
            ...feedback,
            transcript,
            createdAt: serverTimestamp(),
        });

        return NextResponse.json({ id: docRef.id, ...feedback });
    } catch (error: any) {
        console.error("❌ Feedback generation error:", error);
        return NextResponse.json(
            {
                totalScore: 0,
                categoryScores: [],
                strengths: [],
                areasForImprovement: [],
                finalAssessment: "No feedback generated due to AI error.",
            },
            { status: 500 }
        );
    }
}
