import React from 'react';

export const DemoNotice: React.FC = () => (
  <aside
    role="note"
    className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950"
  >
    <strong>Demo only:</strong> Do not enter real personal information. Sign-in is
    client-side only, and submitting this form does not send or save an order.
  </aside>
);
