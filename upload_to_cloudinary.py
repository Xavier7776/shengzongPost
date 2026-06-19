#!/usr/bin/env python3
"""上传封面图到Cloudinary并记录URL映射"""

import os
import json
import hashlib
import time
import urllib.request
import urllib.parse

CLOUD_NAME = "dazxe954m"
API_KEY = "261976869959187"
API_SECRET = "1NRIoeWfXrBemPKY2UVH5xjFMKE"
UPLOAD_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
IMAGE_DIR = r"D:\claudecodeworkdir\博客封面图\generated"
OUTPUT_FILE = r"E:\chromeDownload\arc-portfolio\cloudinary_urls.json"

def upload_one(filepath, folder="blog-cover"):
    """上传单张图片到Cloudinary"""
    filename = os.path.basename(filepath)
    print(f"  上传: {filename}...", end=" ", flush=True)
    
    with open(filepath, 'rb') as f:
        image_data = f.read()
    
    timestamp = str(int(time.time()))
    to_sign = f"timestamp={timestamp}{API_SECRET}"
    signature = hashlib.sha1(to_sign.encode()).hexdigest()
    
    params = urllib.parse.urlencode({
        'timestamp': timestamp,
        'signature': signature,
        'api_key': API_KEY,
        'upload_preset': 'ml_default',
        'folder': folder,
        'resource_type': 'image',
    }).encode()
    
    # 手动构造multipart/form-data
    boundary = f"----FormBoundary{hashlib.md5(str(time.time()).encode()).hexdigest()}"
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"timestamp\"\r\n\r\n{timestamp}\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"signature\"\r\n\r\n{signature}\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"api_key\"\r\n\r\n{API_KEY}\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"upload_preset\"\r\n\r\nml_default\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"folder\"\r\n\r\n{folder}\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"resource_type\"\r\n\r\nimage\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\n"
        f"Content-Type: image/png\r\n\r\n"
    ).encode()
    
    body_with_file = body + image_data + f"\r\n--{boundary}--\r\n".encode()
    
    req = urllib.request.Request(
        UPLOAD_URL,
        data=body_with_file,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
            url = result.get('secure_url')
            if url:
                print(f"OK -> {url}")
                return filename, url
            else:
                print(f"FAIL: {result}")
                return filename, None
    except urllib.error.HTTPError as e:
        body_err = e.read().decode()
        print(f"HTTP {e.code}: {body_err[:150]}")
        return filename, None
    except Exception as ex:
        print(f"ERR: {ex}")
        return filename, None

def main():
    if not os.path.exists(IMAGE_DIR):
        print(f"ERROR: 目录不存在 {IMAGE_DIR}")
        return
    
    files = sorted([f for f in os.listdir(IMAGE_DIR) if f.lower().endswith('.png')])
    total = len(files)
    print(f"找到 {total} 张PNG图片")
    
    url_map = {}
    success = 0
    fail = 0
    
    for i, fname in enumerate(files):
        fpath = os.path.join(IMAGE_DIR, fname)
        src_url = upload_one(fpath)
        if src_url[1]:
            url_map[fname] = src_url[1]
            success += 1
        else:
            fail += 1
        
        # 每5张延迟一下
        if (i + 1) % 5 == 0 and i + 1 < total:
            print("  ...等待3s...")
            time.sleep(3)
    
    # 保存映射
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(url_map, f, ensure_ascii=False, indent=2)
    
    print(f"\n===== 完成 =====")
    print(f"成功: {success}")
    print(f"失败: {fail}")
    print(f"映射文件: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
