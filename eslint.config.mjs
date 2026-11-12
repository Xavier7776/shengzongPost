import nextVitals from 'eslint-config-next/core-web-vitals'

export default [
  ...nextVitals,
  // Compiler diagnostics remain visible while existing UI awaits its own migration; React Compiler is not enabled.
  { rules: {
    'react-hooks/purity': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/static-components': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/error-boundaries': 'warn',
  } },
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts', '.tmpbuild/**'] },
]
