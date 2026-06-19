#!/usr/bin/env python3
"""测试博客API连通性"""

import json
import urllib.request

API_BASE = "https://zshengzong.top/api/posts"
AUTH_KEY = "eoEHjT7n-lllLYhIBaiKxokgKLBjKvXmisnG1pnXyw"

# 测试POST创建一篇文章
payload = {
    "slug": "test-upload-" + str(int(__import__('time').time()) % 10000),
    "title": "测试文章 - 自动上传",
    "excerpt": "这是一篇由自动化脚本上传的测试文章。",
    "content": "<p>这是测试内容。</p>",
    "tags": ["TEST"],
    "published": False,
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    API_BASE,
    data=data,
    headers={
        "Content-Type": "application/json",
        "X-Admin-API-Key": AUTH_KEY,
    },
    method="POST",
)

class NoRedirect(urllib.request.HTTPHandler):
    def http_error_307(self, req, fp, code, msg, headers):
        raise urllib.error.HTTPError(req.full_url, code, req.data, headers, None)

try:
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(req, timeout=30) as resp:
        body = json.loads(resp.read().decode())
        print(f"SUCCESS! Status: {resp.status}")
        print(json.dumps(body, indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP Error: {e.code}")
    print(body[:500])
except Exception as ex:
    print(f"Error: {ex}")
