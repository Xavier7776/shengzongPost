path = r'D:\timeModel\gpt-researcher\backend\server\websocket_manager.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''        task_config = {
            "max_sections": headers.get("max_sections", 3) if headers else 3,
            "max_plan_revisions": headers.get("max_plan_revisions", 3) if headers else 3,
            "follow_guidelines": headers.get("follow_guidelines", True) if headers else True,
            "guidelines": headers.get("guidelines",
                ["The report MUST be written in Chinese"]) if headers else ["The report MUST be written in Chinese"],
            "model": headers.get("model", "mimo-v2.5-pro") if headers else "mimo-v2.5-pro",
            "publish_formats": headers.get("publish_formats", {"markdown": True, "pdf": False, "docx": False}) if headers else {"markdown": True, "pdf": False, "docx": False},
            "include_human_feedback": headers.get("include_human_feedback", False) if headers else False,
            "verbose": headers.get("verbose", True) if headers else True,
        }'''

new = '''        task_config = {
            "max_sections": headers.get("max_sections", 3) if headers else 3,
            "max_plan_revisions": headers.get("max_plan_revisions", 3) if headers else 3,
            "follow_guidelines": headers.get("follow_guidelines", True) if headers else True,
            "guidelines": headers.get("guidelines",
                ["The report MUST be written in Chinese"]) if headers else ["The report MUST be written in Chinese"],
            "model": headers.get("model", "mimo-v2.5-pro") if headers else "mimo-v2.5-pro",
            "publish_formats": headers.get("publish_formats", {"markdown": True, "pdf": False, "docx": False}) if headers else {"markdown": True, "pdf": False, "docx": False},
            "include_human_feedback": headers.get("include_human_feedback", False) if headers else False,
            "verbose": headers.get("verbose", True) if headers else True,
            # 语言设置：前端通过 headers.language 传递，默认中文
            "language": headers.get("language", "chinese") if headers else "chinese",
        }'''

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: websocket_manager.py patched - task_config now includes language')
else:
    print('FAIL: old string not found')
