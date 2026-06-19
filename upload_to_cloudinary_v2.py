#!/usr/bin/env python3
"""通过Cloudinary官方库上传封面图"""

import os
import json
import time
import cloudinary
import cloudinary.uploader

CLOUD_NAME = "dazxe954m"
API_KEY = "261976869959187"
API_SECRET = "1NRIoeWfXrBemPKY2UVH5xjFMKE"
IMAGE_DIR = r"D:\claudecodeworkdir\博客封面图\generated"
OUTPUT_FILE = r"E:\chromeDownload\arc-portfolio\cloudinary_urls.json"

cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET,
)

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
        print(f"[{i+1}/{total}] 上传: {fname}...", end=" ", flush=True)

        try:
            result = cloudinary.uploader.upload(
                fpath,
                folder="blog-cover",
                resource_type="image",
                overwrite=True,
            )
            url = result.get('secure_url')
            if url:
                url_map[fname] = url
                success += 1
                print("OK")
            else:
                fail += 1
                print(f"FAIL: {result}")
        except Exception as ex:
            fail += 1
            print(f"ERR: {ex}")

        if (i + 1) % 10 == 0 and i + 1 < total:
            print("  ...等待2s...")
            time.sleep(2)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(url_map, f, ensure_ascii=False, indent=2)

    print(f"\n===== 完成 =====")
    print(f"成功: {success}")
    print(f"失败: {fail}")
    print(f"映射文件: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
