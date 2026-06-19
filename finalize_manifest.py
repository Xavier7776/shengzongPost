#!/usr/bin/env python3
"""更新manifest并生成上传脚本"""
import json

with open(r"E:\chromeDownload\arc-portfolio\blog_manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

html_dir = r"E:\chromeDownload\arc-portfolio\blog"
html_files = sorted([f for f in __import__("os").listdir(html_dir) if f.endswith(".html")])

for i, art in enumerate(manifest):
    art["html_path"] = f"{html_dir}/{html_files[i]}" if i < len(html_files) else None

output = r"E:\chromeDownload\arc-portfolio\blog_upload_final.json"
with open(output, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"最终manifest: {output}")
print(f"文章数: {len(manifest)}")
for a in manifest:
    print(f"  [{a['order']}] {a['slug']} | cover: {a['cover_url'][:60]}... | html: {a.get('html_path','MISSING')}")
