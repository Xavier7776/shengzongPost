#!/usr/bin/env python3
"""通过Cloudinary API直接上传图片"""

import urllib.request
import urllib.parse
import json
import os
import hashlib
import time

CLOUD_NAME = "dazxe954m"
API_KEY = "261976869959187"
API_SECRET = "1NRIoeWfXrBemPKY2UVH5xjFMKE"
UPLOAD_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

def upload_image(file_path: str, folder: str = "blog") -> str:
    """上传单张图片，返回CDN URL"""
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, 'rb') as f:
        image_data = f.read()
    
    # 构建签名
    timestamp = str(int(time.time()))
    to_sign = f"timestamp={timestamp}&upload_preset=blog_upload{API_SECRET}"
    # 实际上应该用更标准的签名方式
    signature_params = f"timestamp={timestamp}{API_SECRET}"
    signature = hashlib.sha1(signature_params.encode()).hexdigest()
    
    data = urllib.parse.urlencode({
        'file': image_data,
        'upload_preset': 'blog_upload',
        'timestamp': timestamp,
        'signature': signature,
        'folder': folder,
    }).encode()
    
    req = urllib.request.Request(UPLOAD_URL, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
            return result.get('secure_url')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Upload failed: {e.code} - {body[:200]}")
        return None

# 测试上传
test_img = r"E:\chromeDownload\arc-portfolio\blog\1-大语言模型驱动的智能体架构演进趋势分析.md.png"
if os.path.exists(test_img):
    url = upload_image(test_img)
    print(f"Test upload result: {url}")
else:
    print(f"Test image not found: {test_img}")
