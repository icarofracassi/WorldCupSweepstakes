import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAMS = [
  // Top 14
  { name: "Argentina", code: "ARG", fifaRanking: 1, flagEmoji: "🇦🇷", isTop14: true },
  { name: "França", code: "FRA", fifaRanking: 2, flagEmoji: "🇫🇷", isTop14: true },
  { name: "Espanha", code: "ESP", fifaRanking: 3, flagEmoji: "🇪🇸", isTop14: true },
  { name: "Inglaterra", code: "ENG", fifaRanking: 4, flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", isTop14: true },
  { name: "Brasil", code: "BRA", fifaRanking: 5, flagEmoji: "🇧🇷", isTop14: true },
  { name: "Bélgica", code: "BEL", fifaRanking: 6, flagEmoji: "🇧🇪", isTop14: true },
  { name: "Portugal", code: "POR", fifaRanking: 7, flagEmoji: "🇵🇹", isTop14: true },
  { name: "Países Baixos", code: "NED", fifaRanking: 8, flagEmoji: "🇳🇱", isTop14: true },
  { name: "Alemanha", code: "GER", fifaRanking: 9, flagEmoji: "🇩🇪", isTop14: true },
  { name: "Colômbia", code: "COL", fifaRanking: 10, flagEmoji: "🇨🇴", isTop14: true },
  { name: "Itália", code: "ITA", fifaRanking: 11, flagEmoji: "🇮🇹", isTop14: true },
  { name: "Croácia", code: "CRO", fifaRanking: 12, flagEmoji: "🇭🇷", isTop14: true },
  { name: "Marrocos", code: "MAR", fifaRanking: 13, flagEmoji: "🇲🇦", isTop14: true },
  { name: "Uruguai", code: "URU", fifaRanking: 14, flagEmoji: "🇺🇾", isTop14: true },
  // Rest of Copa 2026
  { name: "Estados Unidos", code: "USA", fifaRanking: 15, flagEmoji: "🇺🇸", isTop14: false },
  { name: "México", code: "MEX", fifaRanking: 16, flagEmoji: "🇲🇽", isTop14: false },
  { name: "Senegal", code: "SEN", fifaRanking: 17, flagEmoji: "🇸🇳", isTop14: false },
  { name: "Dinamarca", code: "DEN", fifaRanking: 18, flagEmoji: "🇩🇰", isTop14: false },
  { name: "Suíça", code: "SUI", fifaRanking: 19, flagEmoji: "🇨🇭", isTop14: false },
  { name: "Austrália", code: "AUS", fifaRanking: 20, flagEmoji: "🇦🇺", isTop14: false },
  { name: "Equador", code: "ECU", fifaRanking: 21, flagEmoji: "🇪🇨", isTop14: false },
  { name: "Turquia", code: "TUR", fifaRanking: 22, flagEmoji: "🇹🇷", isTop14: false },
  { name: "Coreia do Sul", code: "KOR", fifaRanking: 23, flagEmoji: "🇰🇷", isTop14: false },
  { name: "Japão", code: "JPN", fifaRanking: 24, flagEmoji: "🇯🇵", isTop14: false },
  { name: "Irã", code: "IRN", fifaRanking: 25, flagEmoji: "🇮🇷", isTop14: false },
  { name: "Ucrânia", code: "UKR", fifaRanking: 26, flagEmoji: "🇺🇦", isTop14: false },
  { name: "Polônia", code: "POL", fifaRanking: 27, flagEmoji: "🇵🇱", isTop14: false },
  { name: "Sérvia", code: "SRB", fifaRanking: 28, flagEmoji: "🇷🇸", isTop14: false },
  { name: "Canadá", code: "CAN", fifaRanking: 29, flagEmoji: "🇨🇦", isTop14: false },
  { name: "Chile", code: "CHI", fifaRanking: 30, flagEmoji: "🇨🇱", isTop14: false },
  { name: "Camarões", code: "CMR", fifaRanking: 31, flagEmoji: "🇨🇲", isTop14: false },
  { name: "Peru", code: "PER", fifaRanking: 32, flagEmoji: "🇵🇪", isTop14: false },
  { name: "Costa Rica", code: "CRC", fifaRanking: 33, flagEmoji: "🇨🇷", isTop14: false },
  { name: "Hungria", code: "HUN", fifaRanking: 34, flagEmoji: "🇭🇺", isTop14: false },
  { name: "Albânia", code: "ALB", fifaRanking: 35, flagEmoji: "🇦🇱", isTop14: false },
  { name: "Gana", code: "GHA", fifaRanking: 36, flagEmoji: "🇬🇭", isTop14: false },
  { name: "Venezuela", code: "VEN", fifaRanking: 37, flagEmoji: "🇻🇪", isTop14: false },
  { name: "República Checa", code: "CZE", fifaRanking: 38, flagEmoji: "🇨🇿", isTop14: false },
  { name: "Arábia Saudita", code: "KSA", fifaRanking: 56, flagEmoji: "🇸🇦", isTop14: false },
  { name: "Nigéria", code: "NGA", fifaRanking: 40, flagEmoji: "🇳🇬", isTop14: false },
  { name: "Panamá", code: "PAN", fifaRanking: 41, flagEmoji: "🇵🇦", isTop14: false },
  { name: "Bolívia", code: "BOL", fifaRanking: 85, flagEmoji: "🇧🇴", isTop14: false },
  { name: "Argélia", code: "ALG", fifaRanking: 42, flagEmoji: "🇩🇿", isTop14: false },
  { name: "Paraguai", code: "PAR", fifaRanking: 60, flagEmoji: "🇵🇾", isTop14: false },
  { name: "Nova Zelândia", code: "NZL", fifaRanking: 90, flagEmoji: "🇳🇿", isTop14: false },
  { name: "Egito", code: "EGY", fifaRanking: 44, flagEmoji: "🇪🇬", isTop14: false },
  { name: "Noruega", code: "NOR", fifaRanking: 45, flagEmoji: "🇳🇴", isTop14: false },
  { name: "África do Sul", code: "RSA", fifaRanking: 59, flagEmoji: "🇿🇦", isTop14: false },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const team of TEAMS) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: team,
      create: team,
    });
  }
  console.log(`✅ ${TEAMS.length} teams created`);

  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@bolao.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@bolao.com",
      passwordHash: adminHash,
      isAdmin: true,
    },
  });
  console.log("✅ Admin user created — email: admin@bolao.com / password: admin123");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });