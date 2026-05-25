import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@upendopharmacy.co.tz" },
    update: {},
    create: {
      name: "Admin Upendo",
      email: "admin@upendopharmacy.co.tz",
      password: adminPassword,
      role: "admin",
      phone: "+255 700 000 000",
    },
  });

  // Create categories
  const categoryNames = [
    "Dawa za Malaria",
    "Dawa za Maumivu",
    "Vitamini",
    "Dawa za Shinikizo",
    "Dawa za Kisukari",
    "Dawa za Ngozi",
  ];
  const createdCats: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    createdCats[name] = cat.id;
  }

  // Create medicines
  const medicines = [
    { name: "Paracetamol 500mg", description: "Dawa ya kupunguza maumivu na homa", price: 500, stock: 100, categoryId: createdCats["Dawa za Maumivu"] },
    { name: "Artemether/Lumefantrine", description: "Dawa ya malaria (CoArtem)", price: 5000, stock: 50, requiresPrescription: true, categoryId: createdCats["Dawa za Malaria"] },
    { name: "Vitamin C 500mg", description: "Vitamini C kwa nguvu za mwili", price: 1500, stock: 200, categoryId: createdCats["Vitamini"] },
    { name: "Amlodipine 5mg", description: "Dawa ya shinikizo la damu", price: 800, stock: 80, requiresPrescription: true, categoryId: createdCats["Dawa za Shinikizo"] },
    { name: "Metformin 500mg", description: "Dawa ya kisukari cha aina ya 2", price: 1200, stock: 60, requiresPrescription: true, categoryId: createdCats["Dawa za Kisukari"] },
    { name: "Ibuprofen 400mg", description: "Dawa ya maumivu na uvimbe", price: 600, stock: 150, categoryId: createdCats["Dawa za Maumivu"] },
    { name: "Vitamin B Complex", description: "Vitamini B kwa nguvu za neva", price: 2000, stock: 120, categoryId: createdCats["Vitamini"] },
    { name: "Amoxicillin 250mg", description: "Antibiotiki ya maambukizi", price: 3500, stock: 40, requiresPrescription: true, categoryId: createdCats["Dawa za Maumivu"] },
    { name: "Clotrimazole Cream", description: "Cream ya kutibu fangasi wa ngozi", price: 4500, stock: 30, categoryId: createdCats["Dawa za Ngozi"] },
    { name: "ORS Sachet", description: "Chumvi za kuloweka kwa kuhara", price: 300, stock: 500, categoryId: createdCats["Dawa za Maumivu"] },
  ];

  for (const med of medicines) {
    await prisma.medicine.create({ data: med });
  }

  console.log("✅ Seed imefanikiwa!");
  console.log("👤 Admin login: admin@upendopharmacy.co.tz / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
