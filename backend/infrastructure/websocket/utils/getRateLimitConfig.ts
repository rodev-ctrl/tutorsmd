export const getRateLimitConfig = (role: string, event: string) => {
  if (role === "admin") {
    return { limit: 5, windowMs: 60_000 };
  }

  if (event === "message") {
    return { limit: 30, windowMs: 60_000 };
  }

  if (event === "joinLesson") {
    
  }

  return { limit: 100, windowMs: 60_000 };
};