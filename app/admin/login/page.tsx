import AdminLogin from './AdminLogin'

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ from?: string | string[] }>
}) {
  return <AdminLogin study={(await searchParams).from === 'study'} />
}
