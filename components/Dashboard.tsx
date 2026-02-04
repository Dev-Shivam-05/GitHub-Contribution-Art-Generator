"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  CalendarIcon,
  Github,
  RefreshCw,
  Settings,
  Grid3X3,
  XCircle,
  Monitor,
  Smartphone,
  Undo,
  Redo,
  Linkedin,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import {
  getPatternGrid,
  generateCommitScheduleFromGrid,
} from "@/lib/patternUtils";

function isCanceledError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ((error as { name?: unknown }).name === "CanceledError" ||
      (error as { code?: unknown }).code === "ERR_CANCELED")
  );
}

export default function Dashboard() {
  const { data: session, update } = useSession();

  // Core State
  const [mode, setMode] = useState<"text" | "custom">("text");
  const [text, setText] = useState("");
  const [previewGrid, setPreviewGrid] = useState<number[][]>([]);

  // Request Cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Config State
  const [date, setDate] = useState<Date>();
  const [intensity, setIntensity] = useState([1]);

  // UI/Loading State
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  // Credit System State
  const [credits, setCredits] = useState(0);
  const [accessRequested, setAccessRequested] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(true);

  // Profile State
  const [profileUrl, setProfileUrl] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Manual Date Input State
  const [day, setDay] = useState(new Date().getDate().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [dateError, setDateError] = useState<string | null>(null);

  // History State
  const [history] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Viewport State
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  // Helper to get consistent username
  const getUsername = () => {
    if (!session?.user) return "";
    // Prioritize username from session, fallback to name, then email prefix
    return (
      session.user.username ||
      session.user.name ||
      session.user.email?.split("@")[0] ||
      ""
    );
  };

  useEffect(() => {
    if (session?.user?.image) {
      setProfileUrl(session.user.image);
    }
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (mode === "text") {
      const grid = getPatternGrid(text);
      // Ensure grid is always 52 columns wide (full year view)
      const paddedGrid = grid.map((row) => {
        const newRow = [...row];
        while (newRow.length < 52) {
          newRow.push(0);
        }
        return newRow;
      });
      setPreviewGrid(paddedGrid);
    }
  }, [text, mode]);

  // Poll for status
  const checkStatus = async () => {
    const username = getUsername();
    if (!username) return;
    try {
      const res = await apiClient.get(
        `/request/status?username=${encodeURIComponent(username)}`,
        {
          skipErrorHandling: true,
          shouldRetry: false,
        } as unknown as object,
      );
      if (res.data.success) {
        setCredits(res.data.credits);

        setAccessRequested(res.data.accessRequested);
      }
    } catch (error) {
      console.error("Failed to check status:", error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profileUrl) return;
    try {
      const username = getUsername();
      if (!username) return;
      await apiClient.post("/user/profile", { username, profileUrl });
      await update({ image: profileUrl });
      toast.success("Profile updated!");
      setIsProfileOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualDateChange = (type: "d" | "m" | "y", val: string) => {
    // Allow empty string for typing
    if (val === "") {
      if (type === "d") setDay("");
      if (type === "m") setMonth("");
      if (type === "y") setYear("");
      return;
    }

    const num = parseInt(val);
    if (isNaN(num)) return;

    let d = day;
    let m = month;
    let y = year;

    if (type === "d") {
      if (num > 31) return;
      setDay(val);
      d = val;
    }
    if (type === "m") {
      if (num > 12) return;
      setMonth(val);
      m = val;
    }
    if (type === "y") {
      if (val.length > 4) return;
      setYear(val);
      y = val;
    }

    // Try to construct date
    if (d && m && y && y.length === 4) {
      const dayNum = parseInt(d);
      const monthNum = parseInt(m);
      const yearNum = parseInt(y);

      // Check valid date (e.g. Feb 30)
      const constructed = new Date(yearNum, monthNum - 1, dayNum);
      if (
        constructed.getFullYear() === yearNum &&
        constructed.getMonth() === monthNum - 1 &&
        constructed.getDate() === dayNum
      ) {
        setDate(constructed);
        setDateError(null);
      } else {
        setDateError("Invalid Date");
      }
    }
  };

  // Sync from Calendar to Manual Inputs
  const handleCalendarSelect = (d: Date | undefined) => {
    setDate(d);
    if (d) {
      setDay(d.getDate().toString());
      setMonth((d.getMonth() + 1).toString());
      setYear(d.getFullYear().toString());
      setDateError(null);
    }
  };

  const handleRequestCredit = async () => {
    if (!session) return;
    setRequestLoading(true);
    try {
      const username = getUsername();
      const email = session.user?.email;
      await apiClient.post("/request-access", { username, email });
      toast.success("Request submitted! Waiting for admin approval.");
      checkStatus();
    } catch {
      // apiClient handles error toast
    } finally {
      setRequestLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!session) {
      toast.error("Please sign in first");
      return;
    }
    if ((!text && previewGrid.flat().length === 0) || !date) {
      toast.error("Please fill in all fields");
      return;
    }
    if (dateError) {
      toast.error("Please fix date errors");
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 1. Data-Source Audit
    const userToken = session.accessToken as string;
    const userEmail = session.user?.email as string;

    // 4. Defensive Error Handling
    if (!userToken || !userEmail) {
      toast.error("GitHub token and email are required. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const username = getUsername();
      if (!username) return;

      // --- 🟢 NEW: TIMEZONE-PROOF ALIGNMENT (UTC NOON) 🟢 ---
      // 1. Split the user's date (YYYY-MM-DD)
      const [y, m, d] = date.toISOString().split("T")[0].split("-").map(Number);

      // 2. Create a Date object specifically at NOON (12:00) UTC
      // Note: Month is 0-indexed (0=Jan, 1=Feb), so we use 'm - 1'
      const safeDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

      // 3. Subtract the day of the week (0-6) to slide back to Sunday
      // We use getUTCDay() so it relies on UTC time, not your computer's time
      safeDate.setUTCDate(safeDate.getUTCDate() - safeDate.getUTCDay());

      // 4. Convert back to YYYY-MM-DD string
      const alignedDate = safeDate.toISOString().split("T")[0];
      // --- 🟢 NEW LOGIC ENDS HERE 🟢 ---

      // 3. Payload Construction
      const patternData = generateCommitScheduleFromGrid(
        previewGrid,
        new Date(alignedDate),
        intensity[0],
      );

      const repoName =
        (text || "custom").toLowerCase().replace(/[^a-z0-9]+/g, "-") +
        "-contribution";

      const response = await apiClient.post(
        "/generate",
        {
          githubToken: userToken,
          repoName,
          owner: username,
          email: userEmail,
          patternData,
        },
        {
          signal: abortController.signal,
        },
      );

      if (response.data.success) {
        toast.success("Art generation triggered! Check your GitHub.");
        checkStatus();
      }
    } catch (error: unknown) {
      if (isCanceledError(error)) {
        console.log("Request cancelled");
        return;
      }
      console.error("Generation failed", error);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast.info("Cancelling...");
    }
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setMode("custom");
    // Deep copy grid
    const newGrid = previewGrid.map((row) => [...row]);
    // Toggle
    newGrid[rowIndex][colIndex] = newGrid[rowIndex][colIndex] ? 0 : 1;
    setPreviewGrid(newGrid);
  };

  const handleClear = () => {
    setText("");
    setMode("text"); // Reset to text mode
    setPreviewGrid(getPatternGrid(""));
  };

  const handleBlankCanvas = () => {
    setText("");
    setMode("custom");
    // Create 52 cols x 7 rows blank grid
    const blankGrid = Array(7)
      .fill(0)
      .map(() => Array(52).fill(0));
    setPreviewGrid(blankGrid);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPreviewGrid(history[historyIndex - 1]);
      setMode("custom");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPreviewGrid(history[historyIndex + 1]);
      setMode("custom");
    }
  };

  return (
    <div className="container max-w-7xl py-8 space-y-8 flex flex-col min-h-screen">
      <div className="flex-1 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Create your contribution art
              </p>
            </div>
          </div>

          {/* Profile Widget */}
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden border border-muted bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profileUrl || "/placeholder-user.jpg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://github.com/github.png";
                    }}
                  />
                </div>
                <div className="flex flex-col items-start text-xs">
                  <span className="font-semibold">
                    {session?.user?.name || "User"}
                  </span>
                  <span className="text-muted-foreground">Manage Profile</span>
                </div>
                <Settings className="w-4 h-4 ml-2 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Profile Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image URL</label>
                  <Input
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleProfileUpdate}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-l-4 border-l-primary shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pattern Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between">
                    Pattern Source
                    {mode === "custom" && (
                      <span className="text-xs bg-primary/10 text-primary px-2 rounded-full">
                        Custom Mode
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      className={cn(
                        "text-lg font-mono tracking-widest uppercase transition-colors",
                        mode === "custom" && "border-primary/50 bg-primary/5",
                      )}
                      placeholder={
                        mode === "custom" ? "(Custom Pattern)" : "HELLO"
                      }
                      value={text}
                      onChange={(e) => {
                        setMode("text");
                        setText(e.target.value.toUpperCase());
                      }}
                      maxLength={8}
                      disabled={mode === "custom"}
                    />
                    {mode === "custom" ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleClear}
                        title="Reset to Text Mode"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBlankCanvas}
                        title="Blank Canvas"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type text or click the grid to draw manually.
                  </p>
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <div className="flex flex-col gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? (
                            format(date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleCalendarSelect}
                          disabled={(date) =>
                            date < new Date("1900-01-01") ||
                            date > new Date("2100-12-31")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        className="text-center"
                        placeholder="DD"
                        value={day}
                        onChange={(e) =>
                          handleManualDateChange("d", e.target.value)
                        }
                      />
                      <Input
                        className="text-center"
                        placeholder="MM"
                        value={month}
                        onChange={(e) =>
                          handleManualDateChange("m", e.target.value)
                        }
                      />
                      <Input
                        className="text-center"
                        placeholder="YYYY"
                        value={year}
                        onChange={(e) =>
                          handleManualDateChange("y", e.target.value)
                        }
                      />
                    </div>
                    {dateError && (
                      <p className="text-xs text-destructive font-medium">
                        {dateError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Intensity Input */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">
                      Intensity Multiplier
                    </label>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {intensity}x
                    </span>
                  </div>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    max={10}
                    min={1}
                    step={1}
                    className="py-2"
                  />
                </div>

                <div className="flex items-start space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to Terms & Conditions and to automatically follow
                    the author (@Dev-Shivam-05).
                  </label>
                </div>

                {/* Dynamic Button Logic */}
                <div className="pt-4 border-t flex gap-2">
                  {loading ? (
                    <Button
                      variant="destructive"
                      className="w-full h-12 text-lg font-semibold shadow-lg"
                      onClick={handleCancel}
                    >
                      <XCircle className="mr-2 h-5 w-5" />
                      Stop Generating
                    </Button>
                  ) : credits > 0 ? (
                    <Button
                      className="w-full h-12 text-lg font-semibold shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700"
                      onClick={handleGenerate}
                      disabled={!termsAccepted}
                    >
                      <Github className="mr-2 h-5 w-5" />
                      Commit Art
                    </Button>
                  ) : !accessRequested ? (
                    <Button
                      className="w-full h-12 text-lg font-semibold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700"
                      onClick={handleRequestCredit}
                      disabled={requestLoading}
                    >
                      {requestLoading ? (
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Heart className="mr-2 h-5 w-5" />
                      )}
                      Request 1 Credit
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-12 text-lg font-semibold bg-muted text-muted-foreground cursor-not-allowed"
                      disabled
                    >
                      ⏳ Request Pending
                    </Button>
                  )}
                </div>

                {/* Credits Info */}
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Credits Remaining:</span>
                  <span
                    className={cn(
                      "font-bold",
                      credits > 0 ? "text-green-600" : "text-red-500",
                    )}
                  >
                    {credits}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview (8 cols) */}
          <div className="lg:col-span-8">
            <Card className="h-full border-dashed shadow-sm flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Preview</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewport("desktop")}
                        disabled={viewport === "desktop"}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewport("mobile")}
                        disabled={viewport === "mobile"}
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                      >
                        <Undo className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                      >
                        <Redo className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent
                className={cn(
                  "flex-1 flex overflow-auto p-4 transition-all duration-300",
                  viewport === "mobile"
                    ? "max-w-93.75 mx-auto border-x bg-muted/10"
                    : "w-full",
                )}
              >
                <div className="flex flex-col gap-1 p-2 bg-card rounded-lg border shadow-sm m-auto min-w-max">
                  {previewGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] transition-all duration-200 cursor-pointer hover:scale-110",
                            cell
                              ? "bg-primary shadow-sm"
                              : "bg-muted hover:bg-muted-foreground/20",
                          )}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sleek Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Created by</span>
            <a
              href="https://github.com/Dev-Shivam-05"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Github className="w-4 h-4" />
              Dev-Shivam-05
            </a>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Linkedin className="w-4 h-4 text-blue-600" />
            <span>For feedback or bugs, connect on LinkedIn:</span>
            <a
              href="https://www.linkedin.com/in/shivam-bhadoriya-dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline decoration-dotted underline-offset-4"
            >
              shivam-bhadoriya-dev
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
