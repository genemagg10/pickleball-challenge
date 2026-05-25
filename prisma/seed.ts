import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const teamA = await prisma.team.upsert({
    where: { name: "Dinkers" },
    update: {},
    create: { name: "Dinkers", color: "#1d4ed8", emoji: "🔵" },
  });
  const teamB = await prisma.team.upsert({
    where: { name: "Smashers" },
    update: {},
    create: { name: "Smashers", color: "#dc2626", emoji: "🔴" },
  });

  const adminEmail = process.env.ADMIN_EMAIL || "admin@burtonvalley.local";
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { isAdmin: true },
    create: {
      email: adminEmail,
      name: "Commissioner",
      passwordHash,
      isAdmin: true,
    },
  });

  const existingEvents = await prisma.event.count();
  if (existingEvents === 0) {
    await prisma.event.createMany({
      data: [
        {
          name: "Pickleball Round Robin",
          description:
            "The main event. Doubles matchups across both teams. Each game to 11, win by 2.",
          location: "Burton Valley Courts",
          pointsValue: 10,
          sortOrder: 1,
        },
        {
          name: "Cornhole Tournament",
          description: "Bracket-style cornhole. First to 21 wins.",
          location: "Back patio",
          pointsValue: 5,
          sortOrder: 2,
        },
        {
          name: "Chili Cook-Off",
          description: "Each team submits one pot. Blind taste test, judges score 1-10.",
          location: "Kitchen",
          pointsValue: 3,
          sortOrder: 3,
        },
        {
          name: "Trivia Night",
          description: "5 rounds, 10 questions each. Sports, music, dads-only category.",
          location: "Living room",
          pointsValue: 5,
          sortOrder: 4,
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seeded teams:", teamA.name, "vs", teamB.name);
  // eslint-disable-next-line no-console
  console.log(`Admin user: ${adminEmail} / changeme123 (change this!)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
