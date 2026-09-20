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

export interface FirstListingPrice {
  amount: number; // listed amount, in `unit` when set, otherwise use `divValue`
  currency: string; // raw trade currency tag, for the error message
  unit?: DisplayUnit; // set when the listing currency match one of the calc units
  divValue?: number; // listed price converted to divine
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

export async function fetchFirstListingPrice(
  hash: string,
  league: string | undefined,
): Promise<FirstListingPrice | undefined> {
  if (!hash.trim() || !league) return undefined;

  const query = await decodeSearchHash(hash);
  if (!query) return undefined;

  const search = await requestTradeResultList(
    { query, sort: { price: "asc" } } as TradeRequest,
    league,
  );
  if (!search.result.length) return undefined;

  const results = await requestResults(
    search.id,
    search.result.slice(0, 10),
    { accountName: AppConfig().accountName },
  );

  const listing = results.find(
    (result) => !result.gone && result.priceAmount > 0,
  );
  if (!listing) return undefined;

  const { findPriceByQuery } = usePoeninja();
  const unit = UNIT_BY_TRADE_TAG[listing.priceCurrency];
  const perUnitDiv = findPriceByQuery(
    getCurrencyDetailsId(listing.priceCurrency),
  )?.primaryValue;

  // always return div value
  return {
    amount: listing.priceAmount,
    currency: listing.priceCurrency,
    unit,
    divValue:
      unit === "div"
        ? listing.priceAmount
        : perUnitDiv
          ? listing.priceAmount * perUnitDiv
          : undefined,
  };
}
