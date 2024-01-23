"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const schema_1 = require("@graphql-tools/schema");
const graphql_scalars_1 = require("graphql-scalars");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = require("./auth");
const client_s3_1 = require("@aws-sdk/client-s3");
const sharp_1 = __importDefault(require("sharp"));
const typeDefs = `
scalar DateTime
scalar File

type Query {
  hello: String!
  feed: [Listing!]!
  me: User!
}

type Mutation {
  newListing(description: String!, cost: Float!, prodid: ID!): Listing!
  newProd(name: String!, category: String!, file: File!): Product!
  signup(email: String!, password: String!, name: String!): AuthPayload
  login(email: String!, password: String!): AuthPayload
}

type User {
  id: ID!
  name: String!
  email: String!
  listings: [Listing!]!
} 

type Listing {
  id: ID!
  description: String!
  cost: Float!
  postedBy: User!
  product: Product!
}
 
type Product {
  id: ID!
  name: String!
  category: String!
  photo: String!
  listings: [Listing!]
}

type AuthPayload {
  token: String
  user: User
}
`;
const resolvers = {
    DateTime: graphql_scalars_1.GraphQLDateTime,
    Listing: {
        id: (parent) => parent.id,
        product(parent, args, context) {
            if (!parent.productId) {
                return null;
            }
            return context.prisma.listing
                .findUnique({ where: { id: parent.id } })
                .product();
        },
        description: (parent) => parent.description,
        cost: (parent) => parent.cost,
        postedBy(parent, args, context) {
            if (!parent.postedById) {
                return null;
            }
            return context.prisma.listing
                .findUnique({ where: { id: parent.id } })
                .postedBy();
        },
    },
    User: {
        // ... other User object type field resolver functions ...
        listings: (parent, args, context) => context.prisma.user.findUnique({ where: { id: parent.id } }).listings(),
    },
    Product: {
        // ... other User object type field resolver functions ...
        listings: (parent, args, context) => context.prisma.product
            .findUnique({ where: { id: parent.id } })
            .listings(),
    },
    Query: {
        hello: () => "Hello World!",
        feed: (parent, args, context) => context.prisma.listing.findMany(),
        me(parent, args, context) {
            if (context.currentUser === null) {
                throw new Error("Unauthenticated!");
            }
            return context.currentUser;
        },
    },
    Mutation: {
        // ... other Mutation field resolvers ...
        async signup(parent, args, context) {
            // 1
            const password = await (0, bcryptjs_1.hash)(args.password, 10);
            // 2
            const user = await context.prisma.user.create({
                data: { ...args, password },
            });
            // 3
            const token = (0, jsonwebtoken_1.sign)({ userId: user.id }, auth_1.APP_SECRET);
            // 4
            return { token, user };
        },
        async login(parent, args, context) {
            // 1
            const user = await context.prisma.user.findUnique({
                where: { email: args.email },
            });
            if (!user) {
                throw new Error("No such user found");
            }
            // 2
            const valid = await (0, bcryptjs_1.compare)(args.password, user.password);
            if (!valid) {
                throw new Error("Invalid password");
            }
            const token = (0, jsonwebtoken_1.sign)({ userId: user.id }, auth_1.APP_SECRET);
            // 3
            return { token, user };
        },
        async newListing(parent, args, context) {
            if (context.currentUser === null) {
                throw new Error("Unauthenticated!");
            }
            const newListing = await context.prisma.listing.create({
                data: {
                    description: args.description,
                    cost: args.cost,
                    product: { connect: { id: Number(args.prodid) } },
                    postedBy: { connect: { id: context.currentUser.id } },
                },
            });
            return newListing;
        },
        async newProd(parent, args, context) {
            const credentials = {
                accessKeyId: "peU3s3HTRnG3sikb",
                secretAccessKey: "jvBhdrNxeIRs2QghZzDBVs8RIvxScJwHjgPK7QUB",
            };
            // Create an S3 service client object.
            const s3Client = new client_s3_1.S3Client({
                endpoint: "https://s3.tebi.io",
                credentials: credentials,
                region: "global",
            });
            const _file = await args.file.arrayBuffer();
            if (_file) {
                try {
                    const image = await (0, sharp_1.default)(_file).resize(600, 600).png().toBuffer();
                    await s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: "hpdb",
                        Key: args.file.name,
                        Body: image,
                    }));
                    const newProd = await context.prisma.product.create({
                        data: {
                            name: args.name,
                            category: args.category,
                            photo: `https://s3.tebi.io/hpdb/${args.file.name}`,
                        },
                    });
                    return newProd;
                }
                catch (error) {
                    return error;
                }
            }
        },
    },
};
exports.schema = (0, schema_1.makeExecutableSchema)({
    resolvers: [resolvers],
    typeDefs: [typeDefs],
});
//# sourceMappingURL=schema.js.map