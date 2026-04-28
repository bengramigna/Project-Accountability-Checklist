import { and, eq } from "drizzle-orm";
import { db, projectMembersTable } from "@workspace/db";

export async function isMember(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId),
      ),
    );
  return !!row;
}
