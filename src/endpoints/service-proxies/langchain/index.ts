import express from 'express';
import RequestHandler from "../../base";
import { config } from '../../../config';
import AutonomousServiceHandler from './autonomousHandler';
import {OpenAI} from 'langchain/llms'
import { logger } from '../../../logger';

export const endpoint = 'https://api.openai.com/v1/chat/completions';
export const apiKey = config.services?.openai?.apiKey || process.env.OPENAI_API_KEY;

export default class AutonomousHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const { action } = req.body;
        const openAILLM = new OpenAI({
            openAIApiKey: config.services?.openai?.apiKey,
            modelName: req.body.model,
        })
        const LLMActions = new AutonomousServiceHandler(openAILLM,"nothing")
        try{
            switch (action) {
                case 'START':
                    logger.write(`Starting goal: ${req.body.goal}`)
                    const startGoal = await LLMActions.start_goal_agent({goal:req.body.goal})
                    logger.write(`Sending tasks to client: ${typeof startGoal === "object" ? JSON.stringify(startGoal) : startGoal}`)
                    return res.json(startGoal)
                case 'ANALYZE':
                    logger.write(`Analyzing task: ${req.body.task}`)
                    const analyzeGoal = await LLMActions.analyze_task_agent({goal:req.body.goal, task:req.body.task })
                    logger.write(`Sending analysis results to client: ${typeof analyzeGoal === "object" ? JSON.stringify(analyzeGoal) : analyzeGoal}`)
                    return res.json(analyzeGoal)
                case 'EXECUTE':
                    logger.write(`Executing task: ${req.body.task}`)
                    const executeGoal = await LLMActions.execute_task_agent({goal:req.body.goal, task:req.body.task, analysis:req.body.analysis })
                    logger.write(`Sending execution results to client: ${typeof executeGoal === "object" ? JSON.stringify(executeGoal) : executeGoal}`)
                    return res.json(executeGoal)
                case 'CREATE':
                    const newTasks = await LLMActions.create_new_tasks_agent({
                        goal:req.body.goal,
                        tasks:req.body.tasks,
                        completedTasks: req.body.completedTasks,
                        lastTask: req.body.lastTask,
                        result: req.body.result,
                    })
                    return res.json(newTasks)
                    // return res.send("Action is Create")
                case 'TOOLS':
                    return res.send("Action is tools")
                default:
                    return res.send("No action to be taken")
            }
        }catch(err){
            logger.write(`Error in autonomous handler: ${err}`)
            return res.json({error:err})
        }
    }

    public isProtected() {
        return config.services?.openai?.loginRequired ?? true;
    }
}