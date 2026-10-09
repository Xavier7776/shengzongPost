# Download proxy security: same-cloud asset allowlist

Old /api/download accepted any domain ending in cloudinary.com, and followed upstream redirects. New route only accepts **HTTPS res.cloudinary.com/<configured CLOUDINARY_CLOUD_NAME>/(raw|image|video)/upload/...** (the Cloudinary account is taken from production env); no credentials, hashes or alternate ports. Fetch redirects are explicitly disabled. The response uses Content-Disposition: attachment, nosniff, and a hard 64 MiB streaming cap (including when Content-Length is absent).

The proxy is deliberately more restrictive than before. Validate existing Cloudinary attachments and PDFs on the Vercel Preview; only the configured cloud account is accepted. File links hosted elsewhere should use their original URLs, not the proxy. No production data or DNS changes.

Negative tests cover impersonated hostnames, HTTP, redirects, wrong account, missing env and oversized responses; positive tests cover a known-account PDF and response streaming. This is defense in depth, not proof of network sandboxing.
