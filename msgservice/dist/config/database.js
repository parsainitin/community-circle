"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDatabase = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whastflow';
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log(`[MongoDB] Connected successfully to ${mongoUri}`);
    }
    catch (error) {
        console.error('[MongoDB] Connection error:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    await mongoose_1.default.disconnect();
    console.log('[MongoDB] Disconnected.');
};
exports.disconnectDatabase = disconnectDatabase;
