import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory } from 'react-router-dom';

import { routes } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { Button, Text } from '@deriv-com/quill-ui';

/**
 * Shown once, right after a user completes Deriv OAuth login, before they
 * land on the trade page. Wired in from App/app.jsx: the OAuth callback
 * redirects here instead of straight to '/'.
 */
const Welcome = observer(() => {
    const history = useHistory();
    const { client } = useStore();
    const { loginid, currency } = client;

    const handleContinue = () => {
        history.replace(routes.index);
    };

    React.useEffect(() => {
        const timer = setTimeout(handleContinue, 4000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className='welcome-screen'>
            <div className='welcome-screen__mark'>
                <svg viewBox='0 0 40 40' width='56' height='56'>
                    <rect x='6' y='16' width='10' height='16' fill='#EF4444' rx='1.5' />
                    <line x1='11' y1='6' x2='11' y2='16' stroke='#EF4444' strokeWidth='2.5' />
                    <line x1='11' y1='32' x2='11' y2='36' stroke='#EF4444' strokeWidth='2.5' />
                    <rect x='22' y='22' width='10' height='12' fill='#22C55E' rx='1.5' />
                    <line x1='27' y1='12' x2='27' y2='22' stroke='#22C55E' strokeWidth='2.5' />
                    <line x1='27' y1='34' x2='27' y2='36' stroke='#22C55E' strokeWidth='2.5' />
                    <polyline
                        points='6,34 14,24 24,30 34,18'
                        stroke='#FBBF24'
                        strokeWidth='2'
                        strokeLinecap='round'
                        fill='none'
                    />
                </svg>
            </div>
            <Text as='h1' bold size='xl' className='welcome-screen__title'>
                Welcome to Alphastream
            </Text>
            <Text as='p' className='welcome-screen__subtitle'>
                {loginid ? `You're logged in as ${loginid}${currency ? ` (${currency})` : ''}.` : "You're logged in."}
                {' Institutional intelligence, democratized.'}
            </Text>
            <Button onClick={handleContinue} size='lg' className='welcome-screen__cta'>
                Start trading
            </Button>
        </div>
    );
});

export default Welcome;
