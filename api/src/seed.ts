import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAMS = [
  // Top 14 FIFA
  { name: "Argentina", code: "ARG", fifaRanking: 1, flagEmoji: "🇦🇷", isTop14: true },
  { name: "França", code: "FRA", fifaRanking: 2, flagEmoji: "🇫🇷", isTop14: true },
  { name: "Espanha", code: "ESP", fifaRanking: 3, flagEmoji: "🇪🇸", isTop14: true },
  { name: "Inglaterra", code: "ENG", fifaRanking: 4, flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", isTop14: true },
  { name: "Brasil", code: "BRA", fifaRanking: 5, flagEmoji: "🇧🇷", isTop14: true },
  { name: "Portugal", code: "POR", fifaRanking: 6, flagEmoji: "🇵🇹", isTop14: true },
  { name: "Países Baixos", code: "NED", fifaRanking: 7, flagEmoji: "🇳🇱", isTop14: true },
  { name: "Alemanha", code: "GER", fifaRanking: 8, flagEmoji: "🇩🇪", isTop14: true },
  { name: "Colômbia", code: "COL", fifaRanking: 9, flagEmoji: "🇨🇴", isTop14: true },
  { name: "Itália", code: "ITA", fifaRanking: 10, flagEmoji: "🇮🇹", isTop14: true },
  { name: "Croácia", code: "CRO", fifaRanking: 11, flagEmoji: "🇭🇷", isTop14: true },
  { name: "Uruguai", code: "URU", fifaRanking: 13, flagEmoji: "🇺🇾", isTop14: true },
  { name: "Estados Unidos", code: "USA", fifaRanking: 14, flagEmoji: "🇺🇸", isTop14: true },
  // Rest of confirmed Copa 2026 teams
  { name: "Mexico", code: "MEX", fifaRanking: 15, flagEmoji: "🇲🇽", isTop14: false },
  { name: "Senegal", code: "SEN", fifaRanking: 16, flagEmoji: "🇸🇳", isTop14: false },
  { name: "Dinamarca", code: "DEN", fifaRanking: 17, flagEmoji: "🇩🇰", isTop14: false },
  { name: "Equador", code: "ECU", fifaRanking: 18, flagEmoji: "🇪🇨", isTop14: false },
  { name: "Suíça", code: "SUI", fifaRanking: 19, flagEmoji: "🇨🇭", isTop14: false },
  { name: "Austrália", code: "AUS", fifaRanking: 20, flagEmoji: "🇦🇺", isTop14: false },
  { name: "Japão", code: "JPN", fifaRanking: 21, flagEmoji: "🇯🇵", isTop14: false },
  { name: "Coreia do Sul", code: "KOR", fifaRanking: 22, flagEmoji: "🇰🇷", isTop14: false },
  { name: "Irã", code: "IRN", fifaRanking: 23, flagEmoji: "🇮🇷", isTop14: false },
  { name: "Sérvia", code: "SRB", fifaRanking: 24, flagEmoji: "🇷🇸", isTop14: false },
  { name: "Canadá", code: "CAN", fifaRanking: 25, flagEmoji: "🇨🇦", isTop14: false },
  { name: "Turquia", code: "TUR", fifaRanking: 26, flagEmoji: "🇹🇷", isTop14: false },
  { name: "Ucrânia", code: "UKR", fifaRanking: 27, flagEmoji: "🇺🇦", isTop14: false },
  { name: "Polônia", code: "POL", fifaRanking: 28, flagEmoji: "🇵🇱", isTop14: false },
  { name: "Argélia", code: "ALG", fifaRanking: 29, flagEmoji: "🇩🇿", isTop14: false },
  { name: "Noruega", code: "NOR", fifaRanking: 30, flagEmoji: "🇳🇴", isTop14: false },
  { name: "Áustria", code: "AUT", fifaRanking: 31, flagEmoji: "🇦🇹", isTop14: false },
  { name: "Suécia", code: "SWE", fifaRanking: 32, flagEmoji: "🇸🇪", isTop14: false },
  { name: "Eslováquia", code: "SVK", fifaRanking: 33, flagEmoji: "🇸🇰", isTop14: false },
  { name: "Hungria", code: "HUN", fifaRanking: 34, flagEmoji: "🇭🇺", isTop14: false },
  { name: "República Checa", code: "CZE", fifaRanking: 35, flagEmoji: "🇨🇿", isTop14: false },
  { name: "Escócia", code: "SCO", fifaRanking: 36, flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", isTop14: false },
  { name: "Costa do Marfim", code: "CIV", fifaRanking: 37, flagEmoji: "🇨🇮", isTop14: false },
  { name: "Tunísia", code: "TUN", fifaRanking: 38, flagEmoji: "🇹🇳", isTop14: false },
  { name: "Marrocos", code: "MAR", fifaRanking: 39, flagEmoji: "🇲🇦", isTop14: false },
  { name: "Nigéria", code: "NGA", fifaRanking: 40, flagEmoji: "🇳🇬", isTop14: false },
  { name: "Camarões", code: "CMR", fifaRanking: 41, flagEmoji: "🇨🇲", isTop14: false },
  { name: "África do Sul", code: "RSA", fifaRanking: 42, flagEmoji: "🇿🇦", isTop14: false },
  { name: "Qatar", code: "QAT", fifaRanking: 43, flagEmoji: "🇶🇦", isTop14: false },
  { name: "Arábia Saudita", code: "KSA", fifaRanking: 44, flagEmoji: "🇸🇦", isTop14: false },
  { name: "Bósnia-Herzegovina", code: "BIH", fifaRanking: 45, flagEmoji: "🇧🇦", isTop14: false },
  { name: "Jordânia", code: "JOR", fifaRanking: 46, flagEmoji: "🇯🇴", isTop14: false },
  { name: "Uzbequistão", code: "UZB", fifaRanking: 47, flagEmoji: "🇺🇿", isTop14: false },
  { name: "Congo DR", code: "COD", fifaRanking: 48, flagEmoji: "🇨🇩", isTop14: false },
  { name: "Cabo Verde", code: "CPV", fifaRanking: 49, flagEmoji: "🇨🇻", isTop14: false },
  { name: "Iraque", code: "IRQ", fifaRanking: 50, flagEmoji: "🇮🇶", isTop14: false },
  { name: "Haiti", code: "HAI", fifaRanking: 51, flagEmoji: "🇭🇹", isTop14: false },
  { name: "Curaçao", code: "CUR", fifaRanking: 52, flagEmoji: "🇨🇼", isTop14: false },
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