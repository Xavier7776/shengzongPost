export const DEFAULT_ASSET_REPOSITORY = 'Xavier7776/shengzongPost'
export const DEFAULT_ASSET_BRANCH = 'assets/daily-learn-covers-20261111'

export function assetRepository(): string {
  const repository = process.env.GITHUB_ASSET_REPOSITORY?.trim() || DEFAULT_ASSET_REPOSITORY
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid GitHub asset repository')
  return repository
}

export function assetBranch(): string {
  const branch = process.env.GITHUB_ASSET_BRANCH?.trim() || DEFAULT_ASSET_BRANCH
  // Website uploads must never target a code branch.
  if (!/^assets\/[A-Za-z0-9][A-Za-z0-9_/-]*$/.test(branch) || branch.includes('//')) throw new Error('GitHub asset branch must use assets/')
  return branch
}
