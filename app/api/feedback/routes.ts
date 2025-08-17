import { NextResponse } from "next/server";
import { createFeedback } from "@/lib/actions/general.action";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { interviewId, userId, transcript, feedbackId } = body;

        const result = await createFeedback({
            interviewId,
            userId,
            transcript,
            feedbackId,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("❌ API /feedback error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
