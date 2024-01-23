"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const graphql_yoga_1 = require("graphql-yoga");
const schema_1 = require("./schema");
const context_1 = require("./context");
const graphql_upload_ts_1 = require("graphql-upload-ts");
const app = (0, express_1.default)();
const yoga = (0, graphql_yoga_1.createYoga)({ schema: schema_1.schema, context: context_1.createContext });
app.use(yoga.graphqlEndpoint, yoga);
app.use('/graphql', (0, graphql_upload_ts_1.graphqlUploadExpress)({ maxFileSize: 100000000, maxFiles: 10 }));
app.listen(3000, () => {
});
//# sourceMappingURL=main.js.map