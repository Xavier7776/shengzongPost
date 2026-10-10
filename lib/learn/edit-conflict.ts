export class EditionEditConflict extends Error {
  constructor() { super('技术精读须同时修订 Edition JSON 与正文，并记录更正说明；请使用精读修订接口。') }
}
