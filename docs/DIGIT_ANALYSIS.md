# Digit Analysis ("Moving Cursor with Digits")

This is Alphastream's custom feature described in Phase 5 of the build plan.
The component lives at `packages/trader/src/Modules/DigitAnalysis/` and is
self-contained: it opens its own public WebSocket connection to Deriv (no
login required) and streams live last-digit ticks, independent of the app's
MobX stores.

## What it does

- Renders a 0-9 grid, highlighting the most recent digit (the "moving cursor")
- Shows a rolling frequency percentage per digit (over the last `window_size`
  ticks, default 100)
- Lets the user click a digit to select a trade type (Matches / Differs /
  Over / Under)

## Quick usage (standalone)

```tsx
import { DigitAnalysis } from 'Modules/DigitAnalysis';

<DigitAnalysis symbol='R_100' onDigitSelect={({ digit, trade_type }) => {
    console.log(digit, trade_type);
}} />
```

## Wiring into the live trade form

To make a click actually pre-fill and place a trade, connect `onDigitSelect`
to the existing trade store (`Stores/Modules/Trading/trade-store.ts`). The
relevant observable fields are already used by the built-in trade form:

- `contract_type` — set to `'DIGITMATCH'`, `'DIGITDIFF'`, `'DIGITOVER'`, or
  `'DIGITUNDER'` depending on `trade_type`
- `barrier_1` — set to the selected digit (as a string)

Example, inside a component that has access to `useTraderStore()`:

```tsx
import { useTraderStore } from 'Stores/useTraderStores';
import { DigitAnalysis, TDigitSelection } from 'Modules/DigitAnalysis';

const contractTypeMap: Record<TDigitSelection['trade_type'], string> = {
    match: 'DIGITMATCH',
    differ: 'DIGITDIFF',
    over: 'DIGITOVER',
    under: 'DIGITUNDER',
};

const TradePageWithDigitAnalysis = () => {
    const { onChange, symbol } = useTraderStore();

    const handleDigitSelect = ({ digit, trade_type }: TDigitSelection) => {
        onChange({ target: { name: 'contract_type', value: contractTypeMap[trade_type] } });
        onChange({ target: { name: 'barrier_1', value: String(digit) } });
    };

    return <DigitAnalysis symbol={symbol as any} onDigitSelect={handleDigitSelect} />;
};
```

Place `<TradePageWithDigitAnalysis />` inside the existing trade page layout
(`packages/trader/src/Modules/Trading/Containers/trade.tsx`), or route it to
its own page (e.g. `/digit-analysis`) if you'd rather keep it as a dedicated
dashboard as the build plan suggests.

## Notes

- The public WebSocket uses your `app_id` from `brand.config.json`
  (`app_id.production`). Until you register your own app ID at
  developers.deriv.com, it falls back to Deriv's public demo app ID (`1089`)
  so the ticks stream still works during development.
- Only `R_10`, `R_25`, `R_50`, `R_75`, `R_100`, and `1HZ100V` are wired as
  symbol options — add more in `TDigitAnalysisSymbol` if you want additional
  volatility indices.
- No auth/session tokens are needed for this component — it only reads public
  tick data. Placing the actual trade still goes through the authenticated
  WebSocket exactly as the rest of the app does once you call `onChange` and
  the user hits Purchase.
