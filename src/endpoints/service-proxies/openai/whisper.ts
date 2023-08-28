import express from 'express';
import axios from 'axios';
import { apiKey, whisperEndpoint } from '.';
import RequestHandler from "../../base";
import { config } from '../../../config';
import fs from 'fs';

export default class OpenAIWhisperRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const file: any = req?.file


        if(!file){
            res.status(400).send("No file provided")
            return
        }
        const fileName = Math.random().toString(36).substring(7) + ".mp3"
        // save the file as temp.mp3
        fs.writeFileSync(fileName, file.buffer)

        // generate a random file name

        const tempFile = fs.createReadStream(fileName)

        console.log(tempFile)
        const response = await axios.postForm(whisperEndpoint,
            {
                file: tempFile,
                model: "whisper-1",
                language: "en",

            },
            {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        ).then(resp=>{
            res.send(resp.data)
        }).catch((error) => {
            res.send(error.response)
        }).finally(()=>{
            fs.unlinkSync(fileName)
        });

        // if error console log it
    
        // res.json(response.data);
    
        // const promptTokens = response.data.usage.prompt_tokens as number;
        // const completionTokens = response.data.usage.completion_tokens as number;
        // console.log(`prompt tokens: ${promptTokens}, completion tokens: ${completionTokens}, model: ${req.body.model}`);
    }

    public isProtected() {
        return config.services?.openai?.loginRequired ?? true;
    }
}