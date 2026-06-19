#!/usr/bin/env python3
"""批量更新封面图 - 用 skill 推荐的认证方式"""
import json
import os
import time
import http.cookiejar
import urllib.request
import urllib.parse

TEMP = os.environ.get('TEMP', r'C:\Users\Leonidas\AppData\Local\Temp')
COOKIE_PATH = os.path.join(TEMP, 'blog_cookies_patch.txt')
API_BASE = "https://www.zshengzong.top"

# 加载新封面URL池
with open(r"E:\chromeDownload\arc-portfolio\cloudinary_urls.json", "r") as f:
    url_map = json.load(f)
new_urls = list(url_map.values())

# Step 1: 获取 CSRF
print("Step 1: 获取 CSRF...")
req = urllib.request.Request(f"{API_BASE}/api/auth/csrf")
cj = http.cookiejar.MozillaCookieJar(COOKIE_PATH)
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
with opener.open(req, timeout=15) as resp:
    csrf_data = json.loads(resp.read().decode())
    csrf_token = csrf_data.get('csrfToken', '')
print(f"  CSRF token: {csrf_token[:20]}...")

# Step 2: 登录
print("Step 2: 登录...")
login_url = f"{API_BASE}/api/auth/callback/credentials"
login_data = urllib.parse.urlencode({
    'email': 'leonidasholya@gmail.com',
    'password': '12365478aS@',
    'csrfToken': csrf_token,
    'json': 'true',
}).encode()

req = urllib.request.Request(
    login_url,
    data=login_data,
    headers={
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': f'{API_BASE}/admin/login',
    },
    method='POST'
)
with opener.open(req, timeout=15) as resp:
    login_resp = json.loads(resp.read().decode())
    print(f"  登录结果: {login_resp.get('url', 'unknown')}")

# 保存 cookies
cj.save(ignore_discard=True, ignore_expires=True)
print(f"  Cookies saved to {COOKIE_PATH}")

# 验证 cookies 可用
print("Step 2b: 验证 cookies...")
verify_req = urllib.request.Request(f"{API_BASE}/api/posts/public")
with opener.open(verify_req, timeout=15) as resp:
    posts = json.loads(resp.read().decode())
print(f"  获取到 {len(posts)} 篇文章")

# Step 3: 逐个更新封面
print("Step 3: 批量更新封面...")
success = 0
fail = 0
unchanged = 0

for i, post in enumerate(posts):
    slug = post['slug']
    old_cover = post.get('cover_image') or 'NULL'
    new_cover = new_urls[i % len(new_urls)]
    
    if old_cover == new_cover:
        unchanged += 1
        continue
    
    print(f"  [{i+1}/{len(posts)}] {slug[:40]}... -> OK", end=" ", flush=True)
    
    patch_data = json.dumps({"cover_image": new_cover}, ensure_ascii=False).encode('utf-8')
    patch_url = f"{API_BASE}/api/posts/{slug}"
    
    req = urllib.request.Request(
        patch_url,
        data=patch_data,
        headers={
            'Content-Type': 'application/json; charset=utf-8',
            'Referer': f'{API_BASE}/blog/{slug}',
        },
        method='PATCH'
    )
    
    try:
        with opener.open(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            if result.get('slug') == slug:
                success += 1
                print("OK")
            else:
                fail += 1
                print(f"FAIL: {json.dumps(result, ensure_ascii=False)[:100]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        fail += 1
        print(f"HTTP {e.code}: {body[:80]}")
    
    if (i + 1) % 5 == 0:
        time.sleep(1)

print(f"\n===== 完成 =====")
print(f"成功: {success}")
print(f"失败: {fail}")
print(f"未变: {unchanged}")
print(f"总计: {len(posts)}")
