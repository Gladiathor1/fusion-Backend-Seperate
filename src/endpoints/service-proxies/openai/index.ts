import express from 'express';
import RequestHandler from "../../base";
import { streamingHandler } from './streaming';
import { basicHandler } from './basic';
import { config } from '../../../config';
import { logger } from '../../../logger';

export const endpoint = 'https://api.openai.com/v1/chat/completions';
export const whisperEndpoint = 'https://api.openai.com/v1/audio/transcriptions';
export const apiKey = config.services?.openai?.apiKey || process.env.OPENAI_API_KEY;

export default class OpenAIProxyRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        try{
            logger.write(`OpenAI request received  with following body: ${JSON.stringify(req.body)}`)
            if (req.body?.stream) {
                logger.write(`req.body.stream is ${req.body.stream}, streamingHandler will be called`)
                await streamingHandler(req, res);
            } else {
                logger.write(`req.body.stream is ${req.body.stream}, basicHandler will be called`)
                await basicHandler(req, res);
            }
        } catch(e) {
            console.log("Error while setting up the request :",e);
        }
    }

    public isProtected() {
        return config.services?.openai?.loginRequired ?? true;
    }
}