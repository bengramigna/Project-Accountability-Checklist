import { Router, type IRouter } from "express";
import { and, eq, ilike, or, ne, inArray } from "drizzle-orm";
import { db, usersTable, friendshipsTable } from "@workspace/db";
import {
  ListFriendsResponse,
  SearchUsersResponse,
  AddFriendResponse,
  RemoveFriendResponse,
  AddFriendParams,
  RemoveFriendParams,
  SearchUsersQueryParams,
} from "@workspace/api-zod";
import { requireAuth, getUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/friends", requireAuth, async (req, res): Promise<void> => {
  const uid = getUserId(req);
  const rows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      displayName: usersTable.displayName,
      email: usersTable.email,
      cookiesAccepted: usersTable.cookiesAccepted,
    })
    .from(friendshipsTable)
    .innerJoin(usersTable, eq(usersTable.id, friendshipsTable.friendId))
    .where(eq(friendshipsTable.userId, uid));
  res.json(ListFriendsResponse.parse(rows));
});

router.get("/friends/search", requireAuth, async (req, res): Promise<void> => {
  const uid = getUserId(req);
  const parsed = SearchUsersQueryParams.safeParse(req.query);
  const q = parsed.success ? parsed.data.q ?? "" : "";

  let rows;
  if (q.length === 0) {
    rows = await db
      .select()
      .from(usersTable)
      .where(ne(usersTable.id, uid))
      .limit(50);
  } else {
    const like = `%${q}%`;
    rows = await db
      .select()
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, uid),
          or(
            ilike(usersTable.username, like),
            ilike(usersTable.displayName, like),
          ),
        ),
      )
      .limit(50);
  }

  const friendRows = await db
    .select({ friendId: friendshipsTable.friendId })
    .from(friendshipsTable)
    .where(eq(friendshipsTable.userId, uid));
  const friendSet = new Set(friendRows.map((r) => r.friendId));

  const result = rows.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    isFriend: friendSet.has(u.id),
  }));
  res.json(SearchUsersResponse.parse(result));
});

router.post("/friends/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = AddFriendParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const uid = getUserId(req);
  const friendId = params.data.userId;
  if (friendId === uid) {
    res.status(400).json({ error: "Cannot add yourself" });
    return;
  }
  const [exists] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, friendId));
  if (!exists) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db
    .insert(friendshipsTable)
    .values([
      { userId: uid, friendId },
      { userId: friendId, friendId: uid },
    ])
    .onConflictDoNothing();
  res.json(AddFriendResponse.parse({ ok: true }));
});

router.delete(
  "/friends/:userId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = RemoveFriendParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const uid = getUserId(req);
    const friendId = params.data.userId;
    await db
      .delete(friendshipsTable)
      .where(
        or(
          and(
            eq(friendshipsTable.userId, uid),
            eq(friendshipsTable.friendId, friendId),
          ),
          and(
            eq(friendshipsTable.userId, friendId),
            eq(friendshipsTable.friendId, uid),
          ),
        ),
      );
    res.json(RemoveFriendResponse.parse({ ok: true }));
  },
);

export { inArray };
export default router;
