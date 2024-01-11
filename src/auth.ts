import { JwtPayload, verify } from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

export const APP_SECRET =
  "ooga booga big ooga booga strong im gonna sing my ooga booga song";

export async function authenticateUser(
  prisma: PrismaClient,
  request: Request
): Promise<User | null> {
  const header = request.headers.get("authorization");
  if (header !== null) {
    const token = header.split(" ")[1];
    const tokenPayload = verify(token, APP_SECRET) as JwtPayload;
    const userId = tokenPayload.userId;
    return await prisma.user.findUnique({ where: { id: userId } });
  }

  return null;
}
