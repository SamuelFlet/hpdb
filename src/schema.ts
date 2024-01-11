import { makeExecutableSchema } from "@graphql-tools/schema";
import type { GraphQLContext } from "./context";
import { GraphQLDateTime } from "graphql-scalars";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { APP_SECRET } from "./auth";
import { User, Listing, Product } from "@prisma/client";

const typeDefs = `
scalar DateTime

type Query {
  hello: String!
  feed: [Listing!]!
  me: User!
}
 
type Mutation {
  newListing(description: String!, cost: Float!, prodid: ID!): Listing!
  newProd(name: String!, category: String!, photo: String!): Product!
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
  DateTime: GraphQLDateTime,
  Listing: {
    id: (parent: Listing) => parent.id,
    product(parent: Listing, args: {}, context: GraphQLContext) {
      if (!parent.productId) {
        return null;
      }
      return context.prisma.listing
        .findUnique({ where: { id: parent.id } })
        .product();
    },
    description: (parent: Listing) => parent.description,
    cost: (parent: Listing) => parent.cost,
    postedBy(parent: Listing, args: {}, context: GraphQLContext) {
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
    listings: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).listings()
  },
  Product: {
    // ... other User object type field resolver functions ...
    listings: (parent: Product, args: {}, context: GraphQLContext) =>
      context.prisma.product.findUnique({ where: { id: parent.id } }).listings()
  },
  Query: {
    hello: () => "Hello World!",
    feed: (parent: unknown, args: {}, context: GraphQLContext) =>
      context.prisma.listing.findMany(),
    me(parent: unknown, args: {}, context: GraphQLContext) {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      return context.currentUser;
    },
  },
  Mutation: {
    // ... other Mutation field resolvers ...
    async signup(
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext
    ) {
      // 1
      const password = await hash(args.password, 10);

      // 2
      const user = await context.prisma.user.create({
        data: { ...args, password },
      });

      // 3
      const token = sign({ userId: user.id }, APP_SECRET);

      // 4
      return { token, user };
    },
    async login(
      parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext
    ) {
      // 1
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new Error("No such user found");
      }

      // 2
      const valid = await compare(args.password, user.password);
      if (!valid) {
        throw new Error("Invalid password");
      }

      const token = sign({ userId: user.id }, APP_SECRET);

      // 3
      return { token, user };
    },
    async newListing(
      parent: unknown,
      args: {description: string; cost: number, prodid:number},
      context: GraphQLContext
    ) {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      const newListing = await context.prisma.listing.create({
        data: {
          description: args.description,
          cost: args.cost,
          product: {connect: {id: Number(args.prodid)}},
          postedBy: { connect: { id: context.currentUser.id } },
        },
      });

      return newListing;
    },
    async newProd(
      parent: unknown,
      args: {name: string; category: string, photo:string},
      context: GraphQLContext
    ) {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      const newProd = await context.prisma.product.create({
        data: {
          name: args.name,
          category: args.category,
          photo: args.photo,
        },
      });

      return newProd;
    },
  },
};

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefs],
});
