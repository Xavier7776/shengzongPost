#!/usr/bin/env python3
"""生成封面图URL列表文件"""
import json

with open(r"E:\chromeDownload\arc-portfolio\cloudinary_urls.json", "r") as f:
    url_map = json.load(f)

urls = list(url_map.values())
lines = []
lines.append("# Blog Cover Image URLs (Cloudinary CDN)")
lines.append("")
lines.append("All images uploaded to Cloudinary folder `blog-cover`. Use `?w=1200` for size limiting.")
lines.append("")
lines.append("## Cover URLs")
lines.append("")
lines.append("```")
for u in urls:
    lines.append(u)
lines.append("```")
lines.append("")
lines.append("## Usage")
lines.append("")
lines.append("Append `?w=1200` to any URL for size limiting. **Do NOT add `h=` or `fit=crop`**.")
lines.append("")
lines.append("## Refreshing")
lines.append("")
lines.append("To re-upload images, run the Cloudinary upload script:")
lines.append("```bash")
lines.append("python E:/chromeDownload/arc-portfolio/upload_to_cloudinary_v2.py")
lines.append("```")

output = r"D:\hermes\skills\productivity\blog-publishing\references\openai-cover-urls.md"
with open(output, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"已写入 {len(urls)} 张封面图URL到: {output}")
