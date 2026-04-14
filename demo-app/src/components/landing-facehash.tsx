'use client';

import { Facehash } from 'facehash';

const AVATARS = [
  { name: 'zauth-core', colors: ['#1F0473', '#2d0a8c', '#4c1d95', '#6d28d9'] },
  { name: 'zauth-proof', colors: ['#0f766e', '#0ea5e9', '#1d4ed8', '#0e7490'] },
  { name: 'zauth-sdk', colors: ['#7c2d12', '#ea580c', '#f59e0b', '#b45309'] },
  { name: 'zauth-verifier', colors: ['#14532d', '#16a34a', '#22c55e', '#15803d'] },
  { name: 'zauth-demo', colors: ['#831843', '#db2777', '#a21caf', '#7e22ce'] },
];

export function LandingFacehash() {
  return (
    <aside className="pow-facehash" aria-hidden>
      {AVATARS.map((avatar) => (
        <Facehash
          key={avatar.name}
          name={avatar.name}
          size={44}
          colors={avatar.colors}
          variant="gradient"
          intensity3d="subtle"
          showInitial={false}
        />
      ))}
    </aside>
  );
}
