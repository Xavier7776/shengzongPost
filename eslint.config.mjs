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
  ...[
  {
    "files": [
      "features/onlyus/**/*.{ts,tsx}",
      "app/onlyus/**/*.{ts,tsx}"
    ],
    "rules": {
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": [
                "@/components/*",
                "@/lib/*",
                "@/stores/*",
                "@/features/*",
                "!@/features/onlyus"
              ],
              "message": "onlyus 是自包含模块：只允许引用 @/features/onlyus/* 与 @/shared/*。跨域引用会使其无法独立剥离，需共享请上提到 @/shared/。"
            }
          ]
        }
      ]
    }
  },
  {
    "files": [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "features/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "stores/**/*.{ts,tsx}",
      "shared/**/*.{ts,tsx}"
    ],
    "ignores": [
      "app/onlyus/**",
      "features/onlyus/**"
    ],
    "rules": {
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": [
                "@/features/onlyus/*"
              ],
              "message": "onlyus 内部实现不对外导出：如需共用代码，请放到 @/shared/。"
            }
          ]
        }
      ]
    }
  }
],
]

