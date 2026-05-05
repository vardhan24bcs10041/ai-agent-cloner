import 'dotenv/config';
import readline from 'readline';
import { runAgent } from './agent.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Welcome to AI Agent CLI Tool. Type your prompt below (or 'exit' to quit):");

const ask = () => {
  rl.question('\nUser: ', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    await runAgent(input);
    ask();
  });
};

ask();
