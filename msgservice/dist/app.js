"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const groupRoutes_1 = __importDefault(require("./routes/groupRoutes"));
const broadcastRoutes_1 = __importDefault(require("./routes/broadcastRoutes"));
const instanceRoutes_1 = __importDefault(require("./routes/instanceRoutes"));
const directMessageRoutes_1 = __importDefault(require("./routes/directMessageRoutes"));
const configRoutes_1 = __importDefault(require("./routes/configRoutes"));
const createApp = () => {
    const app = (0, express_1.default)();
    // Middlewares
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false })); // Allow inline QR code base64 rendering
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Serve static UI frontend
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', service: 'WhastFlow Backend', timestamp: new Date() });
    });
    // API Routes
    app.use('/api/config', configRoutes_1.default);
    app.use('/api/instance', instanceRoutes_1.default);
    app.use('/api/webhooks', webhookRoutes_1.default);
    app.use('/api/groups', groupRoutes_1.default);
    app.use('/api/broadcast', broadcastRoutes_1.default);
    app.use('/api/message', directMessageRoutes_1.default);
    // Fallback to Dashboard for root SPA routes
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
    });
    return app;
};
exports.createApp = createApp;
