"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = exports.APP_SECRET = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
exports.APP_SECRET = "ooga booga big ooga booga strong im gonna sing my ooga booga song";
async function authenticateUser(prisma, request) {
    const header = request.headers.get("authorization");
    if (header !== null) {
        const token = header.split(" ")[1];
        const tokenPayload = (0, jsonwebtoken_1.verify)(token, exports.APP_SECRET);
        const userId = tokenPayload.userId;
        return await prisma.user.findUnique({ where: { id: userId } });
    }
    return null;
}
exports.authenticateUser = authenticateUser;
//# sourceMappingURL=auth.js.map