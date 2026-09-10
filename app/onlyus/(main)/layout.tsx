import OnlyUsShell from '@/features/onlyus/components/shell/OnlyUsShell'

export default function OnlyUsMainLayout({ children }: { children: React.ReactNode }) {
  return <OnlyUsShell>{children}</OnlyUsShell>
}
