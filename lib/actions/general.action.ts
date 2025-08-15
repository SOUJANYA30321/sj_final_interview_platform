import { db } from "@/firebase/admin";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";
import { generateObject } from "ai";

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection("interviews")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    const interviews = await db
        .collection("interviews")
        .orderBy("createdAt", "desc")
        .where("finalized", "==", true)
        .where("userId", "!=", userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db.collection("interviews").doc(id).get();
    return interview.data() as Interview | null;
}

interface CreateFeedbackParams {
    interviewId: string;
    userId: string;
    transcript: { role: string; content: string }[];
    feedbackId?: string;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        // Format transcript for prompt
        const formattedTranscript = transcript
            .map((sentence) => `- ${sentence.role}: ${sentence.content}\n`)
            .join("");

        // Call Gemini with structured outputs enabled
        const { object } = await generateObject({
            model: google("gemini-2.0-flash-001", {
                structuredOutputs: true, // ENABLE STRUCTURED OUTPUTS
            }),
            schema: feedbackSchema,
            prompt: `
        You are an AI interviewer analyzing a mock interview. Evaluate the candidate thoroughly.
        Transcript:
        ${formattedTranscript}

        Please provide structured feedback with the following fields ONLY:
        - totalScore (0-100)
        - categoryScores: {
            communicationSkills: number,
            technicalKnowledge: number,
            problemSolving: number,
            culturalRoleFit: number,
            confidenceClarity: number
          }
        - strengths: string
        - areasForImprovement: string
        - finalAssessment: string
      `,
            system: "You are a professional interviewer analyzing a mock interview.",
        });

        // Validate object returned
        if (!object || !object.totalScore) {
            throw new Error("Invalid Gemini response: missing totalScore");
        }

        // Prepare feedback object
        const feedback = {
            interviewId,
            userId,
            totalScore: object.totalScore,
            categoryScores: object.categoryScores,
            strengths: object.strengths,
            areasForImprovement: object.areasForImprovement,
            finalAssessment: object.finalAssessment,
            createdAt: new Date().toISOString(),
        };

        // Create or update feedback document
        const feedbackRef = feedbackId
            ? db.collection("feedback").doc(feedbackId)
            : db.collection("feedback").doc();

        await feedbackRef.set(feedback);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false, error: error.message };
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const feedback = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (feedback.empty) return null;

    const feedbackDoc = feedback.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}
