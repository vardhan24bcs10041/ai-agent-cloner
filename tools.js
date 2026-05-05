import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import axios from "axios";

export async function writeFile(jsonArgs) {
  try {
    const args = JSON.parse(jsonArgs);
    const { filepath, content } = args;
    
    // Force output into 'cloned-website' directory to sandbox generated files
    const safePath = filepath.replace(/^(\.\.?[/\\])+/, ""); // remove any ../
    const finalPath = path.join("cloned-website", safePath);
    
    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.writeFile(finalPath, content, "utf-8");
    return `Successfully wrote to ${finalPath}`;
  } catch (error) {
    return `Error writing file: ${error.message}`;
  }
}

export async function readFile(jsonArgs) {
  try {
    const args = JSON.parse(jsonArgs);
    const { filepath } = args;
    const content = await fs.readFile(filepath, "utf-8");
    return content;
  } catch (error) {
    return `Error reading file: ${error.message}`;
  }
}

export async function executeCommand(cmd) {
  return new Promise((res, rej) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        res(`Error: ${error.message}\nStderr: ${stderr}`);
      } else {
        res(stdout);
      }
    });
  });
}

export async function fetchWebsite(jsonArgs) {
  try {
    const args = JSON.parse(jsonArgs);
    const { url } = args;
    const { data } = await axios.get(url);
    // Limit to 8000 chars to avoid overloading the LLM context
    return data.substring(0, 8000);
  } catch (error) {
    return `Error fetching website: ${error.message}`;
  }
}

export const tool_map = {
  writeFile,
  readFile,
  executeCommand,
  fetchWebsite
};
