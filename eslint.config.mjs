import nextVitals from 'eslint-config-next/core-web-vitals'

export default [
  ...nextVitals,
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts', '.tmpbuild/**'] },
]
