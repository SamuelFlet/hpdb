import { Listing } from "@prisma/client";
import { createPubSub } from "graphql-yoga";

export type PubSubChannels = {
  newListing: [{newListing: Listing}]
};

export const pubSub = createPubSub<PubSubChannels>();
