import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";

export function readRows(inputPath: string) {
  const resolved = resolve(inputPath);
  if (extname(resolved).toLowerCase() === ".json") {
    const raw = readFileSync(resolved, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.rows;
  }

  const raw = readFileSync(resolved, "latin1");
  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = splitCsvLine(headerLine, delimiter);
  return lines.filter(Boolean).map((line) => {
    const values = splitCsvLine(line, delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line: string, delimiter = ",") {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function writeJson(path: string, data: unknown) {
  const resolved = resolve(path);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function list(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return value
    .split(/[|;,/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
