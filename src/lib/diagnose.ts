import { createServerFn } from "@tanstack/react-start";
import { classificationFromIssue, classifyIssue, parseIssueId } from "./classify";
import type { Classification } from "./classify";
import { ISSUE_IDS } from "./os";

function stripFence(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export const diagnoseProblem = createServerFn({ method: "POST" })
  .validator((input: { message: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true; result: Classification } | { ok: false; result: Classification; error: string }> => {
    const fallback = classifyIssue(data.message);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false, result: fallback, error: "AI is not available" };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0,
        max_tokens: 280,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are Orbit, an autonomous laptop technician. Classify the user's problem. Reply with JSON only: {\"issue\":\"<id>\",\"title\":\"short title\",\"diagnosis\":\"one sentence on the likely cause\",\"confidence\":0-1}. issue must be one of: " +
              ISSUE_IDS.join(", ") +
              ". Prefer a specific issue over generic.",
          },
          { role: "user", content: data.message.slice(0, 800) },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, result: fallback, error: `xAI API error ${res.status}` };
    }

    try {
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = stripFence(body.choices?.[0]?.message?.content ?? "");
      const parsed = JSON.parse(raw) as {
        issue?: string;
        title?: string;
        diagnosis?: string;
        confidence?: number;
      };
      const issue = parseIssueId(parsed.issue ?? "") ?? fallback.issue;
      return {
        ok: true,
        result: classificationFromIssue(issue, {
          title: parsed.title,
          diagnosis: parsed.diagnosis,
          confidence:
            typeof parsed.confidence === "number" ? parsed.confidence : 0.88,
        }),
      };
    } catch {
      return { ok: false, result: fallback, error: "Could not parse diagnosis" };
    }
  });
