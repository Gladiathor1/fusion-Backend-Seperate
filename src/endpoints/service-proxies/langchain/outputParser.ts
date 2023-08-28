import { ListOutputParser, StructuredOutputParser, outputparser } from "langchain/output_parsers";

export default class TaskOutputParser implements StructuredOutputParser<any> {
    completed_tasks: string[];
  
    constructor(options: any) {
      this.completed_tasks = options.completed_tasks;
    }
  
    parse(text: string): any {
        console.log(this.completed_tasks)
      try {
        const arrayStr = extractArray(text);
        const allTasks = arrayStr
          .filter((task: string) => realTasksFilter(task))
          .map((task: string) => removePrefix(task));
        return allTasks.filter((task: string) => !this.completed_tasks.includes(task));
      } catch (e) {
        const msg = `Failed to parse tasks from completion '${text}'. Exception: ${e}`;
        console.log(msg);
        // throw new ListOutputParser(msg);
      }
    }
  
    getFormatInstructions(): string {
      return `
        The response should be a JSON array of strings. Example:
  
        ["Search the web for NBA news", "Write some code to build a web scraper"]
  
        This should be parsable by JSON.parse()
      `;
    }
  }
  
  function extractArray(inputStr: string): string[] {
    const regex = /(\[\s*\])|(\[(?:\s*(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*,?)*\s*\])/;
    const match = inputStr.match(regex);
    if (match !== null) {
      return JSON.parse(match[0]);
    } else {
      return handleMultilineString(inputStr);
    }
  }
  
  function handleMultilineString(inputStr: string): string[] {
    const lines = inputStr.split('\n');
    const processedLines = lines
      .filter((line: string) => line.trim() !== '')
      .map((line: string) => line.replace(/.*?(\d+\..+)/, '$1').trim());
  
    if (processedLines.some((line: string) => line.match(/^\d+\..+/))) {
      return processedLines;
    } else {
      throw new Error(`Failed to extract array from ${inputStr}`);
    }
  }
  
  function removePrefix(inputStr: string): string {
    const prefixPattern = /^(Task\s*\d*\.\s*|Task\s*\d*[-:]?\s*|Step\s*\d*[-:]?\s*|Step\s*[-:]?\s*|\d+\.\s*|\d+\s*[-:]?\s*|^\.\s*|^\.*)/i;
    return inputStr.replace(new RegExp(prefixPattern), '');
  }
  
  function realTasksFilter(inputStr: string): boolean {
    const noTaskRegex = /^No( (new|further|additional|extra|other))? tasks? (is )?(required|needed|added|created|inputted).*/i;
    const taskCompleteRegex = /^Task (complete|completed|finished|done|over|success).*/i;
    const doNothingRegex = /^(\s*|Do nothing(\s.*)?)$/i;
  
    return (
      !inputStr.match(noTaskRegex) &&
      !inputStr.match(taskCompleteRegex) &&
      !inputStr.match(doNothingRegex)
    );
  }
  