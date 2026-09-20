import { AppConfig } from "@/web/Config";
import { usePoeninja } from "@/web/background/Prices";
import { getCurrencyDetailsId } from "@/web/price-check/trends/getDetailsId";
import {
  requestTradeResultList,
  requestResults,
} from "@/web/price-check/trade/pathofexile-trade";
import type { DisplayUnit } from "../price-track/widget.js";

type TradeRequest = Parameters<typeof requestTradeResultList>[0];

// follow profit calc unit, if api price unit not match then poe.ninja
const UNIT_BY_TRADE_TAG: Record<string, DisplayUnit> = {
  divine: "div",
  exalted: "exalted",
  chaos: "chaos",
};

export interface ListingPrice {
  amount: number; // listed amount, in `unit` when set, otherwise use `divValue`
  currency: string; // raw trade currency tag, for the error message
  unit?: DisplayUnit; // set when the listing currency match one of the calc units
  divValue?: number; // listed price converted to divine
  sampled: number; // how many listings the average is built from
}

/**
 * POST endpoint need decode version
 */
export async function decodeSearchHash(
  hash: string,
): Promise<TradeRequest["query"] | undefined> {
  try {
    const b64 = hash.trim().replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    // gzip
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return undefined;

    const json = await new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).text();
    return JSON.parse(json) as TradeRequest["query"];
  } catch {
    return undefined;
  }
}

/**
 * Runs the search stored in a slot and returns the average price of the first
 * `SAMPLE_SIZE` priced listings (sorted by price, so: the cheapest ones).
 */
export async function fetchListingPrice(
  hash: string,
  league: string | undefined,
): Promise<ListingPrice | undefined> {
  if (!hash.trim() || !league) return undefined;

  const query = await decodeSearchHash(hash);
  if (!query) return undefined;

  const search = await requestTradeResultList(
    { query, sort: { price: "asc" } } as TradeRequest,
    league,
  );
  if (!search.result.length) return undefined;

  // paginate size 10
  const results = await requestResults(
    search.id,
    search.result.slice(0, 10),
    { accountName: AppConfig().accountName },
  );

  // sample size 3
  const sample = results
    .filter((result) => !result.gone && result.priceAmount > 0)
    .slice(0, 3);
  if (!sample.length) return undefined;

  const { findPriceByQuery } = usePoeninja();
  const toDiv = (amount: number, currency: string) => {
    if (UNIT_BY_TRADE_TAG[currency] === "div") return amount;
    const perUnitDiv = findPriceByQuery(
      getCurrencyDetailsId(currency),
    )?.primaryValue;
    return perUnitDiv ? amount * perUnitDiv : undefined;
  };

  const divValues = sample
    .map((result) => toDiv(result.priceAmount, result.priceCurrency))
    .filter((value): value is number => value !== undefined);

  // averaging raw amounts only makes sense while the whole sample is one currency
  const units = new Set(
    sample.map((result) => UNIT_BY_TRADE_TAG[result.priceCurrency]),
  );
  const unit = units.size === 1 ? [...units][0] : undefined;
  const divValue = divValues.length ? avg(divValues) : undefined;

  return {
    amount: unit
      ? avg(sample.map((result) => result.priceAmount))
      : (divValue ?? 0),
    currency: sample[0].priceCurrency,
    unit,
    divValue,
    sampled: sample.length,
  };
}

const avg = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;