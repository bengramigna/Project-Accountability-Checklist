import {
  db,
  usersTable,
  friendshipsTable,
  projectsTable,
  projectMembersTable,
  tasksTable,
  notesTable,
  documentsTable,
  messagesTable,
  activityTable,
} from "@workspace/db";
import { hashPassword, genId } from "./lib/auth";
import { logger } from "./lib/logger";

async function seed(): Promise<void> {
  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) {
    logger.info("Seed already present, skipping");
    return;
  }

  const demoPwd = hashPassword("demo1234");

  const users = [
    { id: genId(), username: "alex", displayName: "Alex Chen", email: "alex@uiowa.edu", passwordHash: demoPwd, cookiesAccepted: true },
    { id: genId(), username: "jordan", displayName: "Jordan Reyes", email: "jordan@uiowa.edu", passwordHash: demoPwd, cookiesAccepted: true },
    { id: genId(), username: "sam", displayName: "Sam Patel", email: "sam@uiowa.edu", passwordHash: demoPwd, cookiesAccepted: true },
    { id: genId(), username: "morgan", displayName: "Morgan Lee", email: "morgan@uiowa.edu", passwordHash: demoPwd, cookiesAccepted: true },
    { id: genId(), username: "taylor", displayName: "Taylor Brooks", email: "taylor@uiowa.edu", passwordHash: demoPwd, cookiesAccepted: true },
  ];
  await db.insert(usersTable).values(users);

  const [alex, jordan, sam, morgan, taylor] = users;
  if (!alex || !jordan || !sam || !morgan || !taylor) return;

  const friendships = [
    [alex.id, jordan.id],
    [alex.id, sam.id],
    [alex.id, morgan.id],
    [jordan.id, sam.id],
    [jordan.id, morgan.id],
    [sam.id, morgan.id],
    [taylor.id, alex.id],
  ];
  await db.insert(friendshipsTable).values(
    friendships.flatMap(([a, b]) => [
      { userId: a, friendId: b },
      { userId: b, friendId: a },
    ]),
  );

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const p1 = { id: genId(), name: "CS Capstone — Final Presentation", ownerId: alex.id, deadline: new Date(now + 5 * day) };
  const p2 = { id: genId(), name: "Marketing 320 Group Pitch", ownerId: alex.id, deadline: new Date(now + 12 * day) };
  await db.insert(projectsTable).values([p1, p2]);

  await db.insert(projectMembersTable).values([
    { projectId: p1.id, userId: alex.id },
    { projectId: p1.id, userId: jordan.id },
    { projectId: p1.id, userId: sam.id },
    { projectId: p1.id, userId: morgan.id },
    { projectId: p2.id, userId: alex.id },
    { projectId: p2.id, userId: jordan.id },
    { projectId: p2.id, userId: taylor.id },
  ]);

  await db.insert(tasksTable).values([
    { id: genId(), projectId: p1.id, title: "Write project abstract", assigneeId: alex.id, deadline: new Date(now + 2 * day), completed: true, description: "300 word summary for the cover slide" },
    { id: genId(), projectId: p1.id, title: "Build slide deck (intro + demo)", assigneeId: jordan.id, deadline: new Date(now + 3 * day), completed: false, description: null },
    { id: genId(), projectId: p1.id, title: "Record 90s product demo video", assigneeId: sam.id, deadline: new Date(now + 4 * day), completed: false, description: null },
    { id: genId(), projectId: p1.id, title: "Run rehearsal session", assigneeId: null, deadline: new Date(now + 4 * day), completed: false, description: "Open task — somebody claim it" },
    { id: genId(), projectId: p1.id, title: "Print handouts", assigneeId: morgan.id, deadline: new Date(now + 5 * day), completed: false, description: null },
    { id: genId(), projectId: p2.id, title: "Draft positioning statement", assigneeId: taylor.id, deadline: new Date(now + 6 * day), completed: false, description: null },
    { id: genId(), projectId: p2.id, title: "Design pitch deck cover", assigneeId: jordan.id, deadline: new Date(now + 8 * day), completed: false, description: null },
    { id: genId(), projectId: p2.id, title: "Compile competitor matrix", assigneeId: null, deadline: null, completed: false, description: null },
  ]);

  await db.insert(notesTable).values([
    { id: genId(), projectId: p1.id, authorId: alex.id, body: "I'll be out of town next weekend — please ping me on chat if anything blocks you." },
    { id: genId(), projectId: p1.id, authorId: jordan.id, body: "We should finish all slides by Thursday so we have a full day to rehearse." },
  ]);

  await db.insert(documentsTable).values([
    { id: genId(), projectId: p1.id, uploadedById: alex.id, filename: "rubric.pdf", sizeBytes: 184320 },
    { id: genId(), projectId: p1.id, uploadedById: jordan.id, filename: "deck-outline.docx", sizeBytes: 27648 },
  ]);

  await db.insert(messagesTable).values([
    { id: genId(), projectId: p1.id, authorId: jordan.id, body: "Hey team — I just pushed the outline." },
    { id: genId(), projectId: p1.id, authorId: sam.id, body: "Looks good. I'll start on the demo recording tonight." },
    { id: genId(), projectId: p1.id, authorId: alex.id, body: "Thanks both. Marking my abstract complete." },
  ]);

  await db.insert(activityTable).values([
    { id: genId(), projectId: p1.id, actorId: alex.id, kind: "project_created", summary: `created project "${p1.name}"` },
    { id: genId(), projectId: p1.id, actorId: alex.id, kind: "member_joined", summary: "added Jordan Reyes to the project" },
    { id: genId(), projectId: p1.id, actorId: alex.id, kind: "member_joined", summary: "added Sam Patel to the project" },
    { id: genId(), projectId: p1.id, actorId: alex.id, kind: "task_completed", summary: 'Alex Chen finished "Write project abstract"' },
    { id: genId(), projectId: p1.id, actorId: jordan.id, kind: "message_sent", summary: "sent a message" },
    { id: genId(), projectId: p1.id, actorId: jordan.id, kind: "document_added", summary: "uploaded deck-outline.docx" },
    { id: genId(), projectId: p2.id, actorId: alex.id, kind: "project_created", summary: `created project "${p2.name}"` },
  ]);

  logger.info("Seed complete");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  });
