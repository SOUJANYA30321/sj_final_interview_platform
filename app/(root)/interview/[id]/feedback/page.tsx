import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
    getFeedbackByInterviewId,
    getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
    if (!interview) redirect("/");

    const feedback = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user?.id!,
    });

    console.log(feedback);

    // Ensure all fields are arrays
    const categoryScores = Array.isArray(feedback?.categoryScores) ? feedback.categoryScores : [];
    const strengths = Array.isArray(feedback?.strengths) ? feedback.strengths : [];
    const areasForImprovement = Array.isArray(feedback?.areasForImprovement)
        ? feedback.areasForImprovement
        : [];

    return (
        <section className="section-feedback">
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Feedback on the Interview -{" "}
                    <span className="capitalize">{interview.role}</span> Interview
                </h1>
            </div>

            <div className="flex flex-row justify-center my-4">
                <div className="flex flex-row gap-5">
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            Overall Impression:{" "}
                            <span className="text-primary-200 font-bold">
                                {feedback?.totalScore ?? "N/A"}
                            </span>
                            /100
                        </p>
                    </div>

                    <div className="flex flex-row gap-2">
                        <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <hr className="my-4" />

            <p>{feedback?.finalAssessment ?? "No final assessment available."}</p>

            <div className="flex flex-col gap-4 mt-4">
                <h2>Breakdown of the Interview:</h2>
                {categoryScores.length > 0 ? (
                    categoryScores.map((category, index) => (
                        <div key={index}>
                            <p className="font-bold">
                                {index + 1}. {category.name ?? "Unnamed Category"} (
                                {category.score ?? "N/A"}/100)
                            </p>
                            <p>{category.comment ?? "No comment provided."}</p>
                        </div>
                    ))
                ) : (
                    <p>No category scores available.</p>
                )}
            </div>

            <div className="flex flex-col gap-3 mt-4">
                <h3>Strengths</h3>
                {strengths.length > 0 ? (
                    <ul>
                        {strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No strengths provided.</p>
                )}
            </div>

            <div className="flex flex-col gap-3 mt-4">
                <h3>Areas for Improvement</h3>
                {areasForImprovement.length > 0 ? (
                    <ul>
                        {areasForImprovement.map((area, index) => (
                            <li key={index}>{area}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No improvement areas provided.</p>
                )}
            </div>

            <div className="buttons flex gap-3 mt-6">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>

                <Button className="btn-primary flex-1">
                    <Link href={`/interview/${id}`} className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default Page;
