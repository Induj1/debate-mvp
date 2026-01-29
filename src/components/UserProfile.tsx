"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar } from "./ui/avatar";
import { useAuth } from "@/lib/AuthContext";

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-2">
        <Avatar className="h-16 w-16 bg-muted" />
        <CardTitle className="text-xl">{user.email}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-muted-foreground text-sm">ID: {user.id.slice(0, 8)}…</div>
      </CardContent>
    </Card>
  );
}
