"use client";

import { useState } from "react";
import { signInWithEmail, signUpWithEmail, signOut } from "@/lib/auth";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

export default function AuthForm() {
  const { user, loading, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSignUp) {
      const { error: err } = await signUpWithEmail(email, password);
      if (err) setError(err.message);
      else await refreshUser();
    } else {
      const { error: err } = await signInWithEmail(email, password);
      if (err) setError(err.message);
      else await refreshUser();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    await refreshUser();
  };

  if (loading) {
    return (
      <Card className="w-full max-w-sm shadow-md">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Checking session…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          {isSignUp ? "Sign Up" : "Sign In"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
            <div className="flex flex-col items-center gap-4">
              <span className="text-muted-foreground">Signed in as <b>{user.email}</b></span>
              <Button variant="destructive" onClick={handleSignOut} className="w-full">Sign Out</Button>
            </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full">
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-primary"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account?" : "Need an account? Sign Up"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
