import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getSystemPrompt } from "./prompt";
import { allTools } from "./tools";
import { getChannelHistory } from "../message-history/store";
import { searchEmbeddings } from "../embeddings/search";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateChatResponse(
  channelId: string,
  userMessage: string,
  userName: string
): Promise<string> {
  // Get conversation history
  const history = await getChannelHistory(channelId, 10);

  // Convert history to messages format
  const messages: ChatMessage[] = history.map((msg) => ({
    role: msg.isBot ? "assistant" : "user",
    content: msg.content,
  }));

  // Determine if query is code-related
  const codeKeywords =
    /\b(code|function|implementation|how does|file|class|component|api|bug|error|feature)\b/i;
  const userKeywords =
    /\b(who is|who are|contributor|user|author|created by|made by)\b/i;
  const isCodeQuery =
    codeKeywords.test(userMessage) && !userKeywords.test(userMessage);

  // Fetch relevant code snippets only for code-related queries
  let codeContext = "";
  if (isCodeQuery) {
    const relevantCode = await searchEmbeddings(userMessage, 5, 0.6);
    if (relevantCode.length > 0) {
      codeContext = "\n\n## Relevant Code Context\n";
      relevantCode.forEach((result, idx) => {
        const lines =
          result.metadata.startLine && result.metadata.endLine
            ? `Lines ${result.metadata.startLine}-${result.metadata.endLine}`
            : "";
        codeContext += `\n### ${idx + 1}. ${result.filePath} ${lines}\n`;
        codeContext += `Similarity: ${(result.similarity * 100).toFixed(1)}%\n`;
        codeContext += "```" + (result.metadata.language || "") + "\n";
        codeContext += result.content + "\n";
        codeContext += "```\n";
      });
    }
  }

  // Add current user message with code context
  messages.push({
    role: "user",
    content: userMessage + codeContext,
  });

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: getSystemPrompt(),
      messages,
      tools: allTools,
      maxSteps: 5, // Allow multiple tool calls
      temperature: 0.7,
    });

    return result.text;
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
}
