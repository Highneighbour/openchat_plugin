import {
    accessTokenNotFound,
    BadRequestError,
    BotClientFactory,
} from "@open-ic/openchat-botclient-ts";
import { NextFunction, Request, Response } from "express";
import { WithBotClient } from "../../types/index.js";

/**
 * Express middleware to create OpenChat BotClient from command JWT
 * Extracts JWT from x-oc-jwt header and creates bot client for request duration
 */
export function createCommandChatClient(factory: BotClientFactory) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const token = req.headers["x-oc-jwt"];
            if (!token) {
                throw new BadRequestError(accessTokenNotFound());
            }
            
            (req as WithBotClient).botClient = factory.createClientFromCommandJwt(
                token as string
            );
            
            console.log("[OpenChat] Bot client created for command");
            next();
        } catch (err: any) {
            console.error("[OpenChat] Error creating bot client:", err);
            if (err instanceof BadRequestError) {
                res.status(400).send(err.message);
            } else {
                res.status(500).send(err.message);
            }
        }
    };
}
