// @ts-ignore
import { EventSource } from "launchdarkly-eventsource";
import express from 'express';
import { apiKey } from ".";
import { countTokensForMessages } from "./tokenizer";
import { logger } from "../../../logger";

export async function streamingHandler(req: express.Request, res: express.Response) {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });

    const messages = req.body.messages;
    const promptTokens = countTokensForMessages(messages);

    let completion = '';

    logger.write(`Preparing Request for Streaming response from OpenAI`)
    const eventSource = new EventSource('https://api.openai.com/v1/chat/completions', {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...req.body,
            stream: true,
        }),
    });

    logger.write(`Request Prepared for Streaming response from OpenAI: ${JSON.stringify(eventSource)}`)

    eventSource.addEventListener('message', async (event: any) => {
        logger.write(`Received streaming response for ${event}`)
        res.write(`data: ${event.data}\n\n`);
        res.flush();

        logger.write(`Streaming response for ${event} written to response`)
        if (event.data === '[DONE]') {
            logger.write(`Streaming response for ${event} is done`)
            res.end();
            eventSource.close();

            logger.write(`Streaming response for ${event} is closed`)
            const totalTokens = countTokensForMessages([
                ...messages,
                {
                    role: "assistant",
                    content: completion,
                },
            ]);
            logger.write(`Streaming response for ${event} has ${totalTokens} tokens`)
            const completionTokens = totalTokens - promptTokens;
            console.log(`prompt tokens: ${promptTokens}, completion tokens: ${completionTokens}, model: ${req.body.model}`);
            return;
        }

        try {
            logger.write(`Parsing streaming response for ${event}`)
            const chunk = parseResponseChunk(event.data);
            logger.write(`Parsed streaming response for ${event}`)
            if (chunk.choices && chunk.choices.length > 0) {
                completion += chunk.choices[0]?.delta?.content || '';
            }
        } catch (e) {
            logger.write(`Error parsing streaming response for ${event}: ${e}`)
        }
    });

    eventSource.addEventListener('error', (event: any) => {
        logger.write(`Error streaming response for ${event}`)
    });

    eventSource.addEventListener('abort', (event: any) => {
        logger.write(`Aborted streaming response for ${event}`)
        res.end();
    });

    req.on('close', (e:any) => {
        logger.write(`Closing streaming response for ${req.body.model} because request closed, ${e}`)
        eventSource.close();
    });

    res.on('error', e => {
        logger.write(`Error streaming response for ${req.body.model}: ${e}`)
        eventSource.close();
    });
}

function parseResponseChunk(buffer: any) {
    logger.write(`Parsing streaming response chunk for ${buffer}`)
    const chunk = buffer.toString().replace('data: ', '').trim();

    if (chunk === '[DONE]') {
        return {
            done: true,
        };
    }

    const parsed = JSON.parse(chunk);

    return {
        id: parsed.id,
        done: false,
        choices: parsed.choices,
        model: parsed.model,
    };
}