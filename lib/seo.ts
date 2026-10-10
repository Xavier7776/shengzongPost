import { getSiteUrl } from './site-url'

export const jsonLdText = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')
export function breadcrumbs(items: { name: string; path: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index+1, name: item.name, item: getSiteUrl()+item.path,
  })) }
}
