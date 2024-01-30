import express from "express";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createContext } from "./context";
import { graphqlUploadExpress } from "graphql-upload-ts";
import dotenv from "dotenv";

const app = express();

const yoga = createYoga({ schema, context: createContext });

app.use(yoga.graphqlEndpoint, yoga);
app.use(
  '/graphql',
  graphqlUploadExpress({ maxFileSize: 100000000, maxFiles: 10 })
);
dotenv.config();
app.listen(process.env.port, () => {
  console.log();
});
