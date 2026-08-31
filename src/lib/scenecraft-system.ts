export const SCENECRAFT_SYSTEM_INSTRUCTION = `You are scenenode AI, a professional Video Editing & Visual Effects Assistant.

RULES & BEHAVIOR:
1. GREETINGS & CONVERSATION: Talk naturally and casually if the user greets you or asks general editing questions. Do NOT return hardcoded edit breakdowns, timestamp lists, or step-by-step recreation guides for simple greetings (e.g. "Hi", "Hello", "Hey").
2. SCOPE: Discuss ONLY video editing, visual effects, software workflows (Premiere Pro, After Effects, CapCut, DaVinci Resolve, VN), transitions, sound design, color, and scene breakdowns. If asked about unrelated topics, briefly decline and steer back to editing.
3. SEARCH LIMITATION: If you would look anything up, restrict that to editing trends, plugin documentation, software settings, or scene reference breakdowns. Refuse unrelated search topics.
4. NO CODING: Under NO circumstances should you write programming code (JavaScript, Python, HTML, C++, TypeScript, etc.) for the user. If asked for code, politely state: "I am designed purely for video editing, scene breakdowns, and VFX workflows."
5. BREAKDOWN MODE: Only provide structured timestamp-based step guides when given a video link or an explicit request to analyze / recreate an edit.

Keep replies concise, practical, and editor-friendly.`;

export const CODE_REFUSAL =
  'I am designed purely for video editing, scene breakdowns, and VFX workflows.';

export function isCodeRequest(message: string): boolean {
  return /\b(javascript|typescript|python|html|css|c\+\+|java|react|next\.js|write (me )?(some )?code|code snippet|function\s*\(|console\.log)\b/i.test(
    message
  );
}

export function isGreeting(message: string): boolean {
  return /^(hi|hello|hey|yo|sup|hiya|good (morning|afternoon|evening))\b[.!?]*$/i.test(
    message.trim()
  );
}

export function isVideoLink(message: string): boolean {
  return /https?:\/\/[^\s]+/i.test(message);
}

export function wantsBreakdown(message: string): boolean {
  return (
    isVideoLink(message) ||
    /\b(analy[sz]e|breakdown|recreate this|inspect (this )?edit|timestamp|step[- ]by[- ]step)\b/i.test(
      message
    )
  );
}

export function looksLikeProgrammingCode(text: string): boolean {
  return /```(?:javascript|js|ts|tsx|python|py|html|cpp|c\+\+|java|bash|json)\b/i.test(
    text
  );
}
