import React from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { routes } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';

import Sidebar from 'AppV2/Components/Layout/Sidebar/sidebar';
// [AI]
import GreetingBanner from 'AppV2/Components/Layout/GreetingBanner/greeting-banner';
import CursorDigits from 'AppV2/Components/CursorDigits/cursor-digits';
// [/AI]

import Router from '../../Routes/router';

import './app-shell.scss';

const AppShell = observer(() => {
    const { ui } = useStore();
    const { active_sidebar_flyout } = ui;
    const { isMobile } = useDevice();
    const location = useLocation();

    React.useEffect(() => {
        if (active_sidebar_flyout && location.pathname !== routes.index) {
            ui.closeSidebarFlyout();
        }
    }, [location.pathname]);

    return (
        <div className='app-shell'>
            {/* [AI] Decorative digit cursor trail, matching the landing page */}
            <CursorDigits />
            {!isMobile && <Sidebar />}
            <div className='app-shell__main-content'>
                {/* [AI] Persistent, personalized greeting shown above every page once logged in */}
                <GreetingBanner />
                <Router />
            </div>
        </div>
    );
});

export default AppShell;
