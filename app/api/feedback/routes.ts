import { NextResponse } from "next/server";
import { createFeedback } from "@/lib/actions/general.action";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = await createFeedback(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API feedback error:", error);
        return NextResponse.json(
            { success: false, error: error?.message || "Failed to save feedback" },
            { status: 500 }
        );
    }
}
