import React from 'react';

/**
 * Required by Deriv's white-label branding guidelines (see build plan Phase 8).
 * Deriv requires "Powered by Deriv" to be displayed, plus a disclaimer that
 * this is an independent marketing partner, not Deriv itself.
 */
const PoweredByDeriv = () => (
    <div className='powered-by-deriv'>
        <p className='powered-by-deriv__badge'>Powered by Deriv — Regulated since 1999</p>
        <p className='powered-by-deriv__disclaimer'>
            Alphastream is an independent marketing partner of Deriv. All trading accounts are opened and managed
            through Deriv&apos;s regulated platform.
        </p>
    </div>
);

export default PoweredByDeriv;
