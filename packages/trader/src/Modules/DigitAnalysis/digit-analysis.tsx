import React from 'react';
import classNames from 'classnames';

// eslint-disable-next-line import/no-relative-packages
import brand_config from '../../../../../brand.config.json';

/**
 * Alphastream "Moving Cursor with Digits" feature.
 *
 * Connects directly to Deriv's public WebSocket (no auth required) and
 * streams last-digit ticks for a chosen volatility symbol. Shows:
 *   - A 0-9 grid that highlights ("moving cursor") the most recent digit
 *   - Rolling frequency percentages per digit, over a configurable window
 *   - Click-to-trade: clicking a digit invokes onDigitSelect so the host
 *     page can pre-fill an Over/Under or Matches/Differs trade form.
 *
 * This component is self-contained (no MobX/store dependency) so it can be
 * dropped into the trade page, or used on a standalone "Digit Analysis" page.
 * See docs/DIGIT_ANALYSIS.md for wiring instructions.
 */

export type TDigitAnalysisSymbol = 'R_10' | 'R_25' | 'R_50' | 'R_75' | 'R_100' | '1HZ100V';

export type TDigitSelection = {
    digit: number;
    trade_type: 'match' | 'differ' | 'over' | 'under';
};

type TDigitAnalysisProps = {
    /** Volatility index symbol to analyse. Defaults to R_100. */
    symbol?: TDigitAnalysisSymbol;
    /** How many recent ticks to use for the frequency percentages. Defaults to 100. */
    window_size?: number;
    /** Called when the user clicks a digit to start placing a trade on it. */
    onDigitSelect?: (selection: TDigitSelection) => void;
    className?: string;
};

const WS_URL = 'wss://ws.binaryws.com/websockets/v3';

const getAppId = (): string => {
    // app_id is optional in brand.config.json (added once you register at
    // developers.deriv.com), so it's read via a loose cast rather than the
    // strict config type — TypeScript would otherwise reject the access
    // when the key is absent.
    const app_id = (brand_config as { app_id?: { production?: string | number } })?.app_id?.production;
    return app_id && app_id !== 'YOUR_PRODUCTION_APP_ID' ? String(app_id) : '1089'; // 1089 = Deriv's public demo app_id
};

const extractLastDigit = (quote: number, pip_size?: number): number => {
    const decimals = typeof pip_size === 'number' ? pip_size : 2;
    const str = quote.toFixed(decimals);
    return Number(str[str.length - 1]);
};

const DigitAnalysis = ({ symbol = 'R_100', window_size = 100, onDigitSelect, className }: TDigitAnalysisProps) => {
    const [digits, setDigits] = React.useState<number[]>([]);
    const [current_digit, setCurrentDigit] = React.useState<number | null>(null);
    const [is_connected, setIsConnected] = React.useState(false);
    const [selected_digit, setSelectedDigit] = React.useState<number | null>(null);
    const ws_ref = React.useRef<WebSocket | null>(null);
    const reconnect_timeout_ref = React.useRef<ReturnType<typeof setTimeout>>();

    React.useEffect(() => {
        let is_unmounted = false;

        const connect = () => {
            const app_id = getAppId();
            const ws = new WebSocket(`${WS_URL}?app_id=${app_id}`);
            ws_ref.current = ws;

            ws.onopen = () => {
                if (is_unmounted) return;
                setIsConnected(true);
                ws.send(JSON.stringify({ ticks: symbol, subscribe: 1, req_id: 1 }));
            };

            ws.onmessage = event => {
                if (is_unmounted) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.msg_type === 'tick' && data.tick) {
                        const quote = Number(data.tick.quote);
                        const last_digit = extractLastDigit(quote, data.tick.pip_size);
                        setCurrentDigit(last_digit);
                        setDigits(prev => {
                            const next = [...prev, last_digit];
                            if (next.length > window_size) next.shift();
                            return next;
                        });
                    }
                } catch {
                    // Ignore malformed frames
                }
            };

            ws.onclose = () => {
                if (is_unmounted) return;
                setIsConnected(false);
                // Basic auto-reconnect
                reconnect_timeout_ref.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        };

        connect();

        return () => {
            is_unmounted = true;
            if (reconnect_timeout_ref.current) clearTimeout(reconnect_timeout_ref.current);
            ws_ref.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, window_size]);

    const frequencies = React.useMemo(() => {
        const counts = new Array(10).fill(0);
        digits.forEach(d => {
            counts[d] += 1;
        });
        const total = digits.length || 1;
        return counts.map(c => Math.round((c / total) * 1000) / 10); // one decimal place
    }, [digits]);

    const handleDigitClick = (digit: number, trade_type: TDigitSelection['trade_type']) => {
        setSelectedDigit(digit);
        onDigitSelect?.({ digit, trade_type });
    };

    return (
        <div className={classNames('digit-analysis', className)}>
            <div className='digit-analysis__header'>
                <span className='digit-analysis__symbol'>{symbol}</span>
                <span
                    className={classNames('digit-analysis__status', {
                        'digit-analysis__status--live': is_connected,
                    })}
                >
                    {is_connected ? 'Live' : 'Connecting…'}
                </span>
            </div>

            <div className='digit-analysis__grid'>
                {frequencies.map((freq, digit) => {
                    const is_current = digit === current_digit;
                    const is_selected = digit === selected_digit;
                    return (
                        <button
                            key={digit}
                            type='button'
                            className={classNames('digit-analysis__cell', {
                                'digit-analysis__cell--current': is_current,
                                'digit-analysis__cell--selected': is_selected,
                            })}
                            onClick={() => handleDigitClick(digit, 'match')}
                            title={`Digit ${digit}: ${freq}% of last ${digits.length} ticks`}
                        >
                            <span className='digit-analysis__digit'>{digit}</span>
                            <span className='digit-analysis__freq'>{freq}%</span>
                        </button>
                    );
                })}
            </div>

            {selected_digit !== null && (
                <div className='digit-analysis__actions'>
                    <span>Digit {selected_digit} selected — </span>
                    <button type='button' onClick={() => handleDigitClick(selected_digit, 'match')}>
                        Matches
                    </button>
                    <button type='button' onClick={() => handleDigitClick(selected_digit, 'differ')}>
                        Differs
                    </button>
                    <button type='button' onClick={() => handleDigitClick(selected_digit, 'over')}>
                        Over
                    </button>
                    <button type='button' onClick={() => handleDigitClick(selected_digit, 'under')}>
                        Under
                    </button>
                </div>
            )}
        </div>
    );
};

export default DigitAnalysis;
