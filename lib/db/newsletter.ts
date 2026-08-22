// lib/db/newsletter.ts
// 邮件订阅：极简存储，email 主键天然去重

import { sql } from './_core'

export async function subscribeNewsletter(email: string): Promise<{ alreadySubscribed: boolean }> {
  const rows = await sql`
    INSERT INTO newsletter_subscribers(email) VALUES(${email})
    ON CONFLICT (email) DO NOTHING
    RETURNING email`
  return { alreadySubscribed: rows.length === 0 }
}

export async function getNewsletterCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS n FROM newsletter_subscribers`
  return (rows[0] as { n: number }).n
}
