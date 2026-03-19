type GeminiGenerateJsonArgs = {
  model?: string;
  system: string;
  user: string;
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to .env and restart `npm run dev`.",
    );
  }
  return apiKey;
}

export async function geminiGenerateJsonText(args: GeminiGenerateJsonArgs) {
  const apiKey = getGeminiApiKey();
  const rawModel = args.model ?? process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  const model = rawModel.startsWith("models/") ? rawModel.slice("models/".length) : rawModel;

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`,
  );
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `SYSTEM:\n${args.system}\n\n` +
                `USER:\n${args.user}\n\n` +
                "Return STRICT JSON only. No markdown, no prose.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini request failed: ${res.status} ${text}`.slice(0, 800));
  }

  const data = (await res.json()) as any;
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.content?.parts?.find?.((p: any) => typeof p?.text === "string")
      ?.text;

  if (!text || typeof text !== "string") {
    throw new Error("Gemini response missing text content");
  }
  return text.trim();
}

