import express from "express";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createContext } from "./context";
import { graphqlUploadExpress } from "graphql-upload-ts";

const app = express();

const yoga = createYoga({ schema, context: createContext });

app.use(yoga.graphqlEndpoint, yoga,);
app.use('/graphql', graphqlUploadExpress({maxFileSize:100000000, maxFiles:10}))
app.listen(3000, () => {
  
});
