import express from "express";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createContext } from "./context";

const app = express();

const yoga = createYoga({ schema, context: createContext });

app.use(yoga.graphqlEndpoint, yoga);

app.listen(4000, () => {
  console.log(`GraphQL API located at http://localhost:4000/graphql`);
});
