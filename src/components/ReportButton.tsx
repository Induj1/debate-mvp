"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export default function ReportButton({ onReport }: { onReport: () => void }) {
  const [reported, setReported] = useState(false);
  return (
    <Button
      variant={reported ? "destructive" : "outline"}
      onClick={() => { setReported(true); onReport(); }}
      disabled={reported}
    >
      {reported ? 'Reported' : 'Report User'}
    </Button>
  );
}
