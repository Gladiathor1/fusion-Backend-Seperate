import { LLMChain } from 'langchain/chains';
import { start_goal_prompt, analyze_task_prompt, create_tasks_prompt } from './promptTemplates';
import TaskOutputParser from './outputParser';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { config } from '../../../config';
import ToolToUse from './tools/toolToUse';
import Logger from '../../../logger';


const logger = new Logger()
class AutonomousServiceHandler {
  model_settings: any; // changed type to any for now only
  agent_memory: any; // changed type to any for now only
  _language: string;

  constructor(model_settings: any, agent_memory: any) { // changed type to any for now only
    logger.write("Initialized Goal Handler")
    this.model_settings = model_settings;
    this.agent_memory = agent_memory;
    this._language = model_settings.language || "English";
  }

  async start_goal_agent({ goal }: { goal: string }): Promise<string[]> {


    const completion: any = await new LLMChain({ llm: this.model_settings, prompt: start_goal_prompt }).call({ goal: goal, language: this._language });

    logger.write(`Got tasks for the goal: ${goal}`)
    logger.write(`Parsing the response...`)

    const task_output_parser = new TaskOutputParser({ completed_tasks: [] });
    const tasks = task_output_parser.parse(completion.text);

    logger.write(`Parsed the response`)

    logger.write(`Sending the response with tasks`)


    return tasks;
  }

  async analyze_task_agent({ goal, task, tool_names }: { goal: any, task: any, tool_names?: string[] }) {
    try {
      const chain = new LLMChain({ llm: this.model_settings, prompt: analyze_task_prompt });

      logger.write(`Task analysis prompt created`)

      const zod_parser = StructuredOutputParser.fromZodSchema(z.object({
        reasoning: z.string().describe(`Reason about task via existing information or understanding. "
        "Make decisions / selections from options`),
        action: z.string().describe(`Action to take to complete task`),
        arg: z.string().describe(`Argument to action`),
      }))

      logger.write(`Zod parser created for task analysis`)

      const completion: any = await chain.call({
        goal: goal,
        task: task,
        language: this._language,
        tools_overview: tool_names || config.tools,
      });

      logger.write(`Got response for task analysis`)

      try {

        logger.write(`Parsing the response...`)
        // return pydantic_parser.parse(completion);
        const parsedResponse =  await zod_parser.parse(completion.text);

        logger.write(`Parsed the response`)
        logger.write(`Sending the response with analysis of task`)

        return parsedResponse;
      } catch (error) {

        logger.write(`Error parsing analysis: ${error}`, "error")
        console.log(`Error parsing analysis: ${error}`);

        return "NOTHING";
      }
    }catch(e){

      logger.write(`Error analyzing task: ${e}`, "error")
      return {
        text: `Sorry, I'm having trouble while analyzing this task: ${e}`
      }
    }
  }

  async execute_task_agent({ goal, task, analysis }: { goal: string, task: string, analysis: {action: string, arg: string, reasoning: string} }): Promise<StreamingResponse> {
    try {

      logger.write(`Finding tool for action ${analysis.action}...`)

      let tool_class: any = config.tools
      tool_class = tool_class.find((tool: any) => tool === analysis.action);


      if(!tool_class) {
        logger.write(`Tool not found for executing action: ${analysis.action}`, "error")
        return {
          text: `Sorry, I'm unable to execute this task with the following details agent provided: ${analysis.action}`
        }
      }

      logger.write(`Tool found for executing action: ${analysis.action}`)
      logger.write(`Getting ready the '${tool_class}' tool for executing action ${analysis.action}...`)
      const getTool = new ToolToUse(this.model_settings, tool_class)

      logger.write(`Executing task with '${tool_class}' for the action ${analysis.action}`)

      const taskResult =  await getTool.get_tool_result({
        goal: goal,
        task: task,
        analysis,
      })

      if(taskResult) logger.write(`Task execution completed`)
      else {
        logger.write(`Error executing task: ${analysis.action}`, "error")
        logger.write(`Task execution failed with the following details: ${taskResult}`, "error")
        logger.write(`Sending the response with user error message`, "error")
        return {
          text: `Sorry, I'm unable to execute this task with the following details agent provided: ${taskResult}`
        }
      }


      logger.write(`Preparing and returing execution results: ${typeof taskResult === "object" ? JSON.stringify(taskResult) : taskResult}`)

      return taskResult;
    }catch(e){

      logger.write(`Error executing task: ${e}`, "error")
      return {
        text: `Sorry, I'm unable to execute this task with the following details agent provided: ${e}`
      }
    }
  }


  async create_new_tasks_agent({goal,tasks,lastTask,result,completedTasks}:{goal:string,tasks:string[],lastTask:string,result:string,completedTasks:string}): Promise<string[]> {
    const chain = new LLMChain({llm:this.model_settings, prompt: create_tasks_prompt});
    const uncompletedTasks:any = tasks

    const completion: any = await chain.call({
      "goal": goal,
      "language": this._language,
      "tasks": uncompletedTasks,
      "lastTask": lastTask,
      "result": result
    });

    const previousTasks:any = (completedTasks || []).concat(uncompletedTasks);
    console.log(previousTasks)

    const taskOutputParser = new TaskOutputParser({ completed_tasks: previousTasks });
    tasks = taskOutputParser.parse(completion.text);

    if (!tasks || tasks.length === 0) {
      console.log(`No additional tasks created: '${completion}'`);
      return tasks;
    }

    const uniqueTasks: string[] = [];
    // const memory = this.agent_memory;
    for (const task of tasks) {
      // const similarTasks = memory.getSimilarTasks(task, { scoreThreshold: 0.98 /* TODO: Once we use ReAct, revisit */ });
      const similarTasks = previousTasks.filter((t:any) => t === task);

      // Check if similar tasks are found
      if (similarTasks.length === 0) {
        uniqueTasks.push(task);
      } else {
        console.log(`Similar tasks to '${task}' found: ${similarTasks}`);
      }
      // memory.addTasks(uniqueTasks);
    }

    return uniqueTasks;
  }


}

export default AutonomousServiceHandler;
