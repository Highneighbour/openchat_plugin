import { IAgentRuntime } from "@elizaos/core";
import { BotClientFactory, BotClient } from "@open-ic/openchat-botclient-ts";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { 
    OpenChatBotConfig, 
    WithBotClient, 
    OpenChatScope,
    OpenChatEvent 
} from "../types/index.js";
import { createCommandChatClient } from "../bot/middleware/botclient.js";
import { executeCommand } from "../bot/handlers/executeCommand.js";
import { notifyHandler } from "../bot/handlers/notify.js";
import { schemaHandler } from "../bot/handlers/schema.js";

/**
 * OpenChat Client Service
 * Manages the OpenChat bot server and integration with ElizaOS runtime
 */
export class OpenChatClientService {
    private runtime: IAgentRuntime;
    private factory: BotClientFactory;
    private app: Express;
    private server: any;
    private config: OpenChatBotConfig;
    private installations: Map<string, { scope: OpenChatScope; permissions: string[] }>;

    constructor(runtime: IAgentRuntime, config: OpenChatBotConfig) {
        this.runtime = runtime;
        this.config = config;
        this.installations = new Map();

        // Initialize BotClientFactory
        this.factory = new BotClientFactory({
            openchatPublicKey: config.openchatPublicKey,
            icHost: config.icHost,
            identityPrivateKey: config.identityPrivateKey,
            openStorageCanisterId: config.openStorageCanisterId,
        });

        // Initialize Express app
        this.app = express();
        this.setupRoutes();

        this.runtime.logger.info("OpenChat Client Service initialized");
    }

    /**
     * Setup Express routes for OpenChat bot endpoints
     */
    private setupRoutes(): void {
        this.app.use(cors());

        // Command execution endpoint
        this.app.post(
            "/execute_command",
            express.text(),
            createCommandChatClient(this.factory),
            (req: Request, res: Response) => executeCommand(req, res, this.runtime)
        );

        // Notification endpoint for autonomous events
        this.app.post(
            "/notify",
            express.raw({ type: "application/msgpack" }),
            (req: Request, res: Response) => notifyHandler(req, res, this.runtime, this)
        );

        // Bot definition schema endpoint
        this.app.get("/bot_definition", (req: Request, res: Response) => 
            schemaHandler(req, res, this.runtime)
        );

        // Root endpoint (alias for bot_definition)
        this.app.get("/", (req: Request, res: Response) => 
            schemaHandler(req, res, this.runtime)
        );

        this.runtime.logger.debug("OpenChat bot routes configured");
    }

    /**
     * Start the OpenChat bot server
     */
    public async start(): Promise<void> {
        const port = this.config.port || 3000;

        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                this.runtime.logger.success(
                    `OpenChat bot server running on port ${port}`
                );
                this.runtime.logger.info(
                    `Bot definition available at: http://localhost:${port}/bot_definition`
                );
                resolve();
            });
        });
    }

    /**
     * Stop the OpenChat bot server
     */
    public async stop(): Promise<void> {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    this.runtime.logger.info("OpenChat bot server stopped");
                    resolve();
                });
            });
        }
    }

    /**
     * Create a bot client for command context
     */
    public createClientFromJwt(jwt: string): BotClient {
        return this.factory.createClientFromCommandJwt(jwt);
    }

    /**
     * Create a bot client for autonomous context
     */
    public createClientForScope(
        scope: OpenChatScope,
        apiGatewayUrl: string,
        permissions?: string[]
    ): BotClient {
        return this.factory.createClientInAutonomouseContext(
            scope as any,
            apiGatewayUrl,
            permissions as any
        );
    }

    /**
     * Record bot installation
     */
    public recordInstallation(
        scopeKey: string,
        scope: OpenChatScope,
        permissions: string[]
    ): void {
        this.installations.set(scopeKey, { scope, permissions });
        this.runtime.logger.info(
            `Bot installed in ${scope.kind}: ${scope.chatId} with ${permissions.length} permissions`
        );
    }

    /**
     * Record bot uninstallation
     */
    public recordUninstallation(scopeKey: string): void {
        this.installations.delete(scopeKey);
        this.runtime.logger.info(`Bot uninstalled from scope: ${scopeKey}`);
    }

    /**
     * Get all installations
     */
    public getInstallations(): Map<string, { scope: OpenChatScope; permissions: string[] }> {
        return this.installations;
    }

    /**
     * Check if bot is installed in a scope
     */
    public isInstalledIn(scopeKey: string): boolean {
        return this.installations.has(scopeKey);
    }

    /**
     * Get factory instance
     */
    public getFactory(): BotClientFactory {
        return this.factory;
    }

    /**
     * Get runtime instance
     */
    public getRuntime(): IAgentRuntime {
        return this.runtime;
    }
}

export default OpenChatClientService;