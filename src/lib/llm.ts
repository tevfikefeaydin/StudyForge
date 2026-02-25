const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export function isLLMConfigured(): boolean {
  return LLM_API_KEY.length > 0 && !LLM_API_KEY.startsWith("sk-your");
}

export async function chatCompletion(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<LLMResponse> {
  if (!isLLMConfigured()) {
    throw new Error("LLM_NOT_CONFIGURED");
  }

  const { temperature = 0.7, maxTokens = 2000, jsonMode = false } = options ?? {};

  const body: Record<string, unknown> = {
    model: LLM_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}
