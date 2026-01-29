"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function FeedbackPanel({ feedback }: { feedback: string | null }) {
  if (!feedback) return null;
  return (
    <Card className="my-6 border-green-200 bg-green-50 text-green-900">
      <CardHeader>
        <CardTitle>AI Judge Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-line">{feedback}</div>
      </CardContent>
    </Card>
  );
}
