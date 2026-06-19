#!/usr/bin/env python3
"""测试博客API连通性"""

import subprocess
import json

AUTH_KEY="eoEH...Xyw"

payload = {
    "slug": "test-upload-" + str(int(__import__('time').time()) % 10000),
    "title": "测试文章 - 自动上传",
    "excerpt": "这是一篇由自动化脚本上传的测试文章。",
    "content": "<p>这是测试内容。</p>",
    "tags": ["TEST"],
    "published": False,
}

cmd = [
    "curl", "-s", "-L", "-X", "POST",
    "https://zshengzong.top/api/posts",
    "-H", "Content-Type: application/json",
    "-H", f"X-Admin-API-Key: {AUTH_KEY}",
    "-d", json.dumps(payload),
]

print("Running:", " ".join(cmd))
result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
print(f"Exit code: {result.returncode}")
print(f"Stdout: {result.stdout[:1000]}")
print(f"Stderr: {result.stderr[:500]}")
