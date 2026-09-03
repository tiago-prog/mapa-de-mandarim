import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import mysql from "mysql2/promise";

async function main() {
const rootDir = process.cwd();
const migrationsDir = path.join(rootDir, "drizzle");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL é obrigatória para aplicar migrações");
}

const migrationFiles = (await fs.readdir(migrationsDir))
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .sort();

const database = new URL(databaseUrl);
const connection = await mysql.createConnection({
  host: database.hostname,
  port: database.port ? Number(database.port) : 3306,
  user: decodeURIComponent(database.username),
  password: decodeURIComponent(database.password),
  database: decodeURIComponent(database.pathname.replace(/^\//, "")),
  multipleStatements: true,
});

try {
  await connection.query(
    "CREATE TABLE IF NOT EXISTS `_mapa_local_migrations` (`name` varchar(255) NOT NULL PRIMARY KEY, `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );

  const [rows] = await connection.query("SELECT `name` FROM `_mapa_local_migrations`");
  const applied = new Set((rows as Array<{ name: string }>).map((row) => row.name));

  for (const file of migrationFiles) {
    if (applied.has(file)) {
      console.log(`[db] já aplicada: ${file}`);
      continue;
    }

    const migration = (await fs.readFile(path.join(migrationsDir, file), "utf8"))
      .replace(/-->\s*statement-breakpoint/g, "");

    console.log(`[db] aplicando: ${file}`);
    await connection.beginTransaction();
    try {
      await connection.query(migration);
      await connection.query("INSERT INTO `_mapa_local_migrations` (`name`) VALUES (?)", [file]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  console.log(`[db] ${migrationFiles.length} migrações verificadas`);
} finally {
  await connection.end();
}
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
