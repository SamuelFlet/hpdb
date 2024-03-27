import { makeExecutableSchema } from "@graphql-tools/schema";
import type { GraphQLContext } from "./context";
import { GraphQLDateTime } from "graphql-scalars";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { APP_SECRET } from "./auth";
import { User, Listing, Product, Prisma } from "@prisma/client";
import { generate } from "randomstring";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const typeDefs = `
scalar DateTime
scalar File

input ListingOrderByInput {
  cost: Sort
}
 
enum Sort {
  asc
  desc
}

type Subscription {
  newListing: Listing!
}

type Query {
  hello: String!
  feed: [Listing!]!
  prodlistFeed(orderBy: ListingOrderByInput, id:Int!): [Listing!]
  getProduct(id:Int!): Product
  getListing(id:Int!): Listing
  prodfeed: [Product!]!
  me: User!
  avg(id:Int!): String
}

type Mutation {
  newListing(title: String!, description: String!, cost: Float!, file:File! prodid: ID!): Listing!
  newProd(name: String!, category: String!, file: File!): Product!
  signup(email: String!, password: String!, name: String!): AuthPayload
  login(email: String!, password: String!): AuthPayload
}

type User {
  id: ID!
  name: String!
  email: String!
  listings: [Listing!]
  reviews: [Review!]
} 

type Listing {
  id: ID!
  condition: String!
  title: String!
  description: String!
  cost: Float!
  photo: String!
  postedby: User!
  product: Product!
}

type Review {
  id: ID!
  title: String!
  content: String!
  rating: Int!
  postedby: User!
  product: Product!
}
 
type Product {
  id: ID!
  rating: Float!
  name: String!
  category: String!
  photo: String!
  listings: [Listing!]
  reviews: [Review!]
}

type AuthPayload {
  token: String
  user: User
}
`;

const resolvers = {
  DateTime: GraphQLDateTime,
  // Listing resolver
  Listing: {
    id: (parent: Listing) => parent.id,
    product(parent: Listing, args: {}, context: GraphQLContext) {
      if (!parent.productid) {
        return null;
      }
      return context.prisma.listing
        .findUnique({ where: { id: parent.id } })
        .product();
    },
    description: (parent: Listing) => parent.description,
    cost: (parent: Listing) => parent.cost,
    postedby(parent: Listing, args: {}, context: GraphQLContext) {
      if (!parent.postedbyid) {
        return null;
      }
      return context.prisma.listing
        .findUnique({ where: { id: parent.id } })
        .postedby();
    },
  },
  // User resolver
  User: {
    // ... other User object type field resolver functions ...
    listings: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).listings(),
    reviews: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).reviews(),
  },
  // Product resolver
  Product: {
    // ... other User object type field resolver functions ...
    listings: (parent: Product, args: {}, context: GraphQLContext) =>
      context.prisma.product
        .findUnique({ where: { id: parent.id } })
        .listings(),
    reviews: (parent: Product, args: {}, context: GraphQLContext) =>
      context.prisma.product.findUnique({ where: { id: parent.id } }).reviews(),
  },
  Subscription: {
    newListing: {
      subscribe: (parent: unknown, args: {}, context: GraphQLContext) =>
        context.pubSub.subscribe("newListing"),
    },
  },
  Query: {
    // Test query
    hello: () => "Hello World!",
    // Gives list of all listings
    feed: (parent: unknown, args: {}, context: GraphQLContext) =>
      context.prisma.listing.findMany(),
    prodlistFeed(
      parent: unknown,
      args: {
        id: number;
        orderBy?: {
          cost?: Prisma.SortOrder;
        };
      },
      context: GraphQLContext
    ) {
      return context.prisma.listing.findMany({
        where: { productid: args.id },
        orderBy: args.orderBy,
      });
    },
    async getProduct(
      parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) {
      const product = await context.prisma.product.findUnique({
        where: {
          id: args.id,
        },
      });
      return product;
    },
    async getListing(
      parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) {
      const listing = await context.prisma.listing.findUnique({
        where: {
          id: args.id,
        },
      });
      return listing;
    },
    async avg(
      parent: Product,
      args: { id: number },
      context: GraphQLContext
    ) {
      const aggregations = await context.prisma.review.aggregate({
        where:{productid:args.id},
        _avg: {
          rating: true,
        },
      })
      return aggregations._avg.rating
    },
    // Gives list of all products

    prodfeed: (parent: unknown, args: {}, context: GraphQLContext) =>
      context.prisma.product.findMany(),
    // Gives current user
    me(parent: unknown, args: {}, context: GraphQLContext) {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }
      return context.currentUser;
    },
  },
  Mutation: {
    // Mutation to sign up new User
    async signup(
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext
    ) {
      const password = await hash(args.password, 10);
      const user = await context.prisma.user.create({
        data: { ...args, password },
      });
      const token = sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },
    // Signs user into website and gives jwt token
    async login(
      parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext
    ) {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new Error("No such user found");
      }
      const valid = await compare(args.password, user.password);
      if (!valid) {
        throw new Error("Invalid password");
      }
      const token = sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },
    // Creates a new listing
    async newListing(
      parent: unknown,
      args: {
        title: string;
        description: string;
        cost: number;
        condition: string;
        file: File;
        prodid: number;
      },
      context: GraphQLContext
    ) {
      const credentials = {
        accessKeyId: "peU3s3HTRnG3sikb",
        secretAccessKey: "jvBhdrNxeIRs2QghZzDBVs8RIvxScJwHjgPK7QUB",
      };
      const s3Client = new S3Client({
        endpoint: "https://s3.tebi.io",
        credentials: credentials,
        region: "global",
      });
      const _file = await args.file.arrayBuffer();
      if (_file) {
        try {
          const image = await sharp(_file).resize(600, 600).png().toBuffer();
          const filename = generate({
            length: 12,
            charset: "alphabetic",
          });
          await s3Client.send(
            new PutObjectCommand({
              Bucket: "hpdb",
              Key: `Listings/${filename}.png`,
              Body: image,
            })
          );
          const newListing = await context.prisma.listing.create({
            data: {
              title: args.title,
              description: args.description,
              cost: args.cost,
              condition: args.condition,
              photo: `https://s3.tebi.io/hpdb/Listings/${filename}.png`,
              product: { connect: { id: Number(args.prodid) } },
              postedby: { connect: { id: context.currentUser.id } },
            },
          });
          context.pubSub.publish("newListing", { newListing });
          return newListing;
        } catch (error) {
          return error;
        }
      }
    },
    // Creates a new product
    async newProd(
      parent: unknown,
      args: { name: string; category: string; file: File },
      context: GraphQLContext
    ) {
      const _file = await args.file.arrayBuffer();
      if (_file) {
        const credentials = {
          accessKeyId: "peU3s3HTRnG3sikb",
          secretAccessKey: "jvBhdrNxeIRs2QghZzDBVs8RIvxScJwHjgPK7QUB",
        };
        const s3Client = new S3Client({
          endpoint: "https://s3.tebi.io",
          credentials: credentials,
          region: "global",
        });

        try {
          const image = await sharp(_file).resize(600, 600).png().toBuffer();
          const filename = generate({
            length: 12,
            charset: "alphabetic",
          });
          await s3Client.send(
            new PutObjectCommand({
              Bucket: "hpdb",
              Key: `Products/${filename}.png`,
              Body: image,
            })
          );
          const newProd = await context.prisma.product.create({
            data: {
              name: args.name,
              category: args.category,
              photo: `https://s3.tebi.io/hpdb/Products/${filename}.png`,
            },
          });
          return newProd;
        } catch (error) {
          return error;
        }
      } else {
        throw new Error("No File");
      }
    },
  },
};

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefs],
});
