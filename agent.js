import OpenAI from "openai";
import { system_prompt } from "./systemPrompt.js";
import { tool_map } from "./tools.js";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const models = [
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

export async function runAgent(userInput) {
  const messages = [
    { role: "system", content: system_prompt },
    { role: "user", content: userInput }
  ];

  let currentModelIndex = 0;

  while (true) {
    let response;
    try {
      response = await client.chat.completions.create({
        model: models[currentModelIndex],
        messages: messages,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
    } catch (error) {
      if (error.status === 429) {
        console.log(`\n[SYSTEM] Model ${models[currentModelIndex]} rate limited. Switching to next model...`);
        currentModelIndex++;
        if (currentModelIndex >= models.length) {
          console.log("[SYSTEM] All models exhausted.");
          break;
        }
        continue;
      } else {
        console.error("API Error:", error);
        break;
      }
    }
    
    let content = response.choices[0].message.content;
    if (!content) {
      console.log("[SYSTEM] Model returned empty content. Full response:", JSON.stringify(response));
      break;
    }
    content = content.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "").trim();
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (err) {
      console.log("[SYSTEM] Model returned invalid JSON:", content);
      break;
    }

    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent)
    });

    if (parsedContent.step === "START") {
      console.log("STARTING STEP .... \n");
      console.log(parsedContent);
    } 
    else if (parsedContent.step === "THINK") {
      console.log("THINKING ..... \n");
      console.log(parsedContent);
    } 
    else if (parsedContent.step === "TOOL") {
      console.log("TOOL calling .... \n");
      console.log(`calling ${parsedContent.tool_name}`);

      if (!tool_map[parsedContent.tool_name]) {
        messages.push({
          role: "user",
          content: JSON.stringify({
            step: "OBSERVE",
            content: "This tool is not available"
          })
        });
      } else {
        const data = await tool_map[parsedContent.tool_name](parsedContent.tool_args);
        messages.push({
          role: "user",
          content: JSON.stringify({
            step: "OBSERVE",
            content: data
          })
        });
      }
    } 
    else if (parsedContent.step === "OUTPUT") {
      console.log("\n--- AGENT OUTPUT ---");
      console.log(parsedContent.content);
      break;
    }
    else {
      console.log("Unknown step:", parsedContent.step);
      break;
    }
  }
}
