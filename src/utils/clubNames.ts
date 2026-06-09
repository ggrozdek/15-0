const displayNames: Record<string, string> = {
  "a.c. milan": "AC Milan",
  "ac milan": "AC Milan",
  "ajax amsterdam": "Ajax",
  "atletico madrid": "Atletico Madrid",
  "atlético madrid": "Atletico Madrid",
  "club atletico de madrid": "Atletico Madrid",
  "club atlético de madrid": "Atletico Madrid",
  "borussia dortmund": "Borussia Dortmund",
  "chelsea f.c.": "Chelsea",
  "chelsea fc": "Chelsea",
  "f.c. barcelona": "Barcelona",
  "fc barcelona": "Barcelona",
  "fc bayern munchen": "Bayern Munich",
  "fc bayern münchen": "Bayern Munich",
  "fc bayern mĂĽnchen": "Bayern Munich",
  "fc bayern munich": "Bayern Munich",
  "fc porto": "Porto",
  "inter mediolan": "Inter",
  "internazionale": "Inter",
  "fc internazionale milano": "Inter",
  "f.c. internazionale milano": "Inter",
  "juventus f.c.": "Juventus",
  "juventus fc": "Juventus",
  "liverpool f.c.": "Liverpool",
  "liverpool fc": "Liverpool",
  "manchester city f.c.": "Manchester City",
  "manchester city fc": "Manchester City",
  "manchester united f.c.": "Manchester United",
  "manchester united fc": "Manchester United",
  "olympique lyon": "Lyon",
  "olympique marseille": "Marseille",
  "paris saint-germain": "PSG",
  "paris saint-germain f.c.": "PSG",
  "paris saint-germain fc": "PSG",
  "psv eindhoven": "PSV",
  "real madrid cf": "Real Madrid",
  "real madrid c.f.": "Real Madrid",
  "real madrid": "Real Madrid",
  "sl benfica": "Benfica",
};

function stripDiacritics(value: string) {
  return value
    .replace(/ĂĽ|ăľ/g, "u")
    .replace(/Ă©|ă©/g, "e")
    .replace(/Ă­|ă­/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeClubName(rawName: string) {
  return stripDiacritics(rawName)
    .replace(/\bfootball club\b/gi, "fc")
    .replace(/\bf\.c\.\b/gi, "fc")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getDisplayClubName(rawName: string) {
  const trimmed = rawName.trim();
  const direct = displayNames[trimmed.toLowerCase()];
  if (direct) return direct;

  const normalized = normalizeClubName(trimmed);
  if (displayNames[normalized]) return displayNames[normalized];

  return trimmed
    .replace(/\s+F\.?C\.?$/i, "")
    .replace(/\s+C\.?F\.?$/i, "")
    .replace(/^FC\s+/i, "")
    .trim();
}
