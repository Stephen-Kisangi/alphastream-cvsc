// [AI]
import React from 'react';
import { observer, useStore } from '@deriv/stores';
import { Text } from '@deriv/components';
import { Localize } from '@deriv-com/translations';

import './greeting-banner.scss';

/**
 * Returns a time-of-day greeting phrase ("Good morning" / "Good afternoon" / "Good evening")
 * based on the visitor's local device time.
 */
const getTimeOfDayGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

/**
 * Persistent, brand-styled greeting shown at the top of every page once a client is logged in.
 * Reads loginid straight off the already-provided @deriv/stores client store — this app's
 * provider tree does not mount @deriv/api-v2's AuthProvider, so hooks like useAuthorize()
 * are NOT safe to call here (they throw outside that context). Renders nothing when logged out.
 */
const GreetingBanner = observer(() => {
    const { client } = useStore();
    const { is_logged_in, loginid } = client;

    const [dismissed, setDismissed] = React.useState(false);

    if (!is_logged_in || dismissed || !loginid) return null;

    const greeting = getTimeOfDayGreeting();

    return (
        <div className='greeting-banner' data-testid='dt_greeting_banner'>
            <Text size='xs' weight='bold' className='greeting-banner__text'>
                <Localize
                    i18n_default_text='{{greeting}}, {{name}} — happy trading!'
                    values={{ greeting, name: loginid }}
                />
            </Text>
            <button
                type='button'
                className='greeting-banner__dismiss'
                aria-label='Dismiss greeting'
                onClick={() => setDismissed(true)}
            >
                ×
            </button>
        </div>
    );
});

export default GreetingBanner;
// [/AI]
