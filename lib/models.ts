export function getModelForPlan(plan: string): string {
  switch (plan) {
    case "free":
      return "gemini-2.0-flash";
    case "starter":
      return "gemini-2.5-flash-lite";
    case "growth":
      return "gemini-2.5-flash";
    case "enterprise":
      return "gemini-2.5-pro";
    default:
      return "gemini-2.0-flash";
  }
}
