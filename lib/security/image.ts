/** MIME and filename are user supplied; only supported raster signatures reach storage. */
export function isRasterImage(bytes: Uint8Array): boolean {
  return (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)) ||
    (bytes.length >= 6 && ['GIF87a','GIF89a'].includes(new TextDecoder().decode(bytes.slice(0,6)))) ||
    (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP')
}
