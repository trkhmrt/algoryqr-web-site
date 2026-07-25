export type ChefProductItem = {
  productId: number;
  menuId: number;
  name: string;
  description: string | null;
  category: string | null;
  categoryId: number | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  available: boolean;
  nutrition?: Record<string, unknown> | null;
};

export type ChefSearchFilters = {
  menuId: number;
  categoryKeyword?: string;
  query?: string;
  minBudget?: number;
  maxBudget?: number;
  maxEnergyKcal?: number;
  minProtein?: number;
  maxFat?: number;
  maxCarbohydrate?: number;
  maxSalt?: number;
  limit?: number;
};

type CategoryRule = {
  keyword: string;
  patterns: RegExp[];
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    keyword: "tatlı",
    patterns: [/\btatl[iı]\w*\b/iu, /\bdessert\w*\b/iu],
  },
  {
    keyword: "ana yemek",
    patterns: [/\bana\s*yemek\w*\b/iu, /\bmain\s*course\w*\b/iu],
  },
  {
    keyword: "başlangıç",
    patterns: [/\bba[sş]lang[iı][cç]\w*\b/iu, /\bstarter\w*\b/iu, /\baperitif\w*\b/iu],
  },
  {
    keyword: "salata",
    patterns: [/\bsalata\w*\b/iu, /\bsalad\w*\b/iu],
  },
  {
    keyword: "içecek",
    patterns: [/\bi[cç]ecek\w*\b/iu, /\bdrink\w*\b/iu, /\bbeverage\w*\b/iu],
  },
];

function stripMatched(text: string, patterns: RegExp[]): string {
  let next = text;
  for (const pattern of patterns) {
    next = next.replace(pattern, " ");
  }
  return next;
}

function parseBudget(text: string): {
  minBudget?: number;
  maxBudget?: number;
  rest: string;
} {
  let rest = text;
  let minBudget: number | undefined;
  let maxBudget: number | undefined;

  const range = rest.match(
    /(\d+(?:[.,]\d+)?)\s*(?:-|–|—|ile|to)\s*(\d+(?:[.,]\d+)?)\s*(?:tl|₺|try)?/iu,
  );
  if (range) {
    const a = Number(range[1].replace(",", "."));
    const b = Number(range[2].replace(",", "."));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      minBudget = Math.min(a, b);
      maxBudget = Math.max(a, b);
      rest = rest.replace(range[0], " ");
      return { minBudget, maxBudget, rest };
    }
  }

  const budgetHint = rest.match(
    /(?:bütçe(?:m|si)?|budget|max|en fazla|altında|kadar)?\s*(\d+(?:[.,]\d+)?)\s*(?:tl|₺|try)\b/iu,
  );
  if (budgetHint) {
    const n = Number(budgetHint[1].replace(",", "."));
    if (Number.isFinite(n)) {
      maxBudget = n;
      rest = rest.replace(budgetHint[0], " ");
      return { minBudget, maxBudget, rest };
    }
  }

  const bare = rest.match(/\b(\d+(?:[.,]\d+)?)\s*(?:tl|₺|try)\b/iu);
  if (bare) {
    const n = Number(bare[1].replace(",", "."));
    if (Number.isFinite(n)) {
      maxBudget = n;
      rest = rest.replace(bare[0], " ");
    }
  }

  return { minBudget, maxBudget, rest };
}

function parseNutrition(text: string): {
  maxEnergyKcal?: number;
  minProtein?: number;
  maxFat?: number;
  maxCarbohydrate?: number;
  maxSalt?: number;
  rest: string;
} {
  let rest = text;
  let maxEnergyKcal: number | undefined;
  let minProtein: number | undefined;
  let maxFat: number | undefined;
  let maxCarbohydrate: number | undefined;
  let maxSalt: number | undefined;

  const kcal = rest.match(
    /(?:(?:max|en fazla|altı|altında|düşük)?\s*)?(\d+(?:[.,]\d+)?)\s*(?:kcal|kalori)\b/iu,
  );
  if (kcal) {
    const n = Number(kcal[1].replace(",", "."));
    if (Number.isFinite(n)) {
      maxEnergyKcal = n;
      rest = rest.replace(kcal[0], " ");
    }
  } else if (/\bdüşük\s+kalori\b/iu.test(rest)) {
    maxEnergyKcal = 300;
    rest = rest.replace(/\bdüşük\s+kalori\b/iu, " ");
  }

  const protein = rest.match(
    /(?:(?:min|en az|yüksek)?\s*)?(\d+(?:[.,]\d+)?)\s*(?:g\s*)?protein\b/iu,
  );
  if (protein) {
    const n = Number(protein[1].replace(",", "."));
    if (Number.isFinite(n)) {
      minProtein = n;
      rest = rest.replace(protein[0], " ");
    }
  } else if (/\byüksek\s+protein\b/iu.test(rest)) {
    minProtein = 15;
    rest = rest.replace(/\byüksek\s+protein\b/iu, " ");
  }

  const fat = rest.match(
    /(?:(?:max|en fazla|düşük)?\s*)?(\d+(?:[.,]\d+)?)\s*(?:g\s*)?(?:yağ|fat)\b/iu,
  );
  if (fat) {
    const n = Number(fat[1].replace(",", "."));
    if (Number.isFinite(n)) {
      maxFat = n;
      rest = rest.replace(fat[0], " ");
    }
  }

  const carb = rest.match(
    /(?:(?:max|en fazla|düşük)?\s*)?(\d+(?:[.,]\d+)?)\s*(?:g\s*)?(?:karbonhidrat|carb(?:ohydrate)?s?)\b/iu,
  );
  if (carb) {
    const n = Number(carb[1].replace(",", "."));
    if (Number.isFinite(n)) {
      maxCarbohydrate = n;
      rest = rest.replace(carb[0], " ");
    }
  }

  const salt = rest.match(
    /(?:(?:max|en fazla|düşük)?\s*)?(\d+(?:[.,]\d+)?)\s*(?:g\s*)?(?:tuz|salt)\b/iu,
  );
  if (salt) {
    const n = Number(salt[1].replace(",", "."));
    if (Number.isFinite(n)) {
      maxSalt = n;
      rest = rest.replace(salt[0], " ");
    }
  }

  return { maxEnergyKcal, minProtein, maxFat, maxCarbohydrate, maxSalt, rest };
}

const NOISE =
  /\b(bana|bir|lütfen|öner|öneri|önerir\w*|istiyorum|isterim|var|mı|mi|mu|mü|neler|ne|var\s*mı|göster|bul|ara|arar\w*|için|ile|ve|veya|şef|chef|menü|menu)\b/giu;

export function parseChefQuery(menuId: number, message: string): ChefSearchFilters {
  const raw = message.trim();
  let working = raw;

  const budget = parseBudget(working);
  working = budget.rest;

  const nutrition = parseNutrition(working);
  working = nutrition.rest;

  let categoryKeyword: string | undefined;
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(working))) {
      categoryKeyword = rule.keyword;
      working = stripMatched(working, rule.patterns);
      break;
    }
  }

  const query = working
    .replace(NOISE, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const filters: ChefSearchFilters = {
    menuId,
    limit: 10,
  };

  if (categoryKeyword) filters.categoryKeyword = categoryKeyword;
  if (budget.minBudget !== undefined) filters.minBudget = budget.minBudget;
  if (budget.maxBudget !== undefined) filters.maxBudget = budget.maxBudget;
  if (nutrition.maxEnergyKcal !== undefined) filters.maxEnergyKcal = nutrition.maxEnergyKcal;
  if (nutrition.minProtein !== undefined) filters.minProtein = nutrition.minProtein;
  if (nutrition.maxFat !== undefined) filters.maxFat = nutrition.maxFat;
  if (nutrition.maxCarbohydrate !== undefined) {
    filters.maxCarbohydrate = nutrition.maxCarbohydrate;
  }
  if (nutrition.maxSalt !== undefined) filters.maxSalt = nutrition.maxSalt;

  if (query) {
    filters.query = query;
  } else if (
    !categoryKeyword &&
    budget.maxBudget === undefined &&
    budget.minBudget === undefined &&
    nutrition.maxEnergyKcal === undefined &&
    nutrition.minProtein === undefined &&
    nutrition.maxFat === undefined &&
    nutrition.maxCarbohydrate === undefined &&
    nutrition.maxSalt === undefined
  ) {
    filters.query = raw;
  }

  return filters;
}
