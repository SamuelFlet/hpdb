"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
async function createContext(initialContext) {
    return {
        prisma,
        currentUser: await (0, auth_1.authenticateUser)(prisma, initialContext.request),
    };
}
exports.createContext = createContext;
//# sourceMappingURL=context.js.map