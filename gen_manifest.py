#!/usr/bin/env python3
"""生成15篇博客文章的manifest（含标题、slug、标签、excerpt）"""
import json

articles = [
    {
        "slug": "ai-agents-architecture-evolution",
        "title": "大语言模型驱动的智能体架构演进趋势分析",
        "excerpt": "从Chatbot到Autonomous Agent，LLM驱动的智能体架构经历了怎样的演变？本文系统梳理了ReAct、Reflexion、Multi-Agent等主流架构的设计思想与适用场景。",
        "tags": ["AI", "AGENT"],
    },
    {
        "slug": "llm-context-window-optimization",
        "title": "大模型上下文窗口优化技术全景",
        "excerpt": "128K甚至1M上下文窗口已成标配，但长文本处理仍面临注意力瓶颈。本文分析RoPE缩放、ALiBi、Ring Attention等核心优化技术。",
        "tags": ["LLM", "OPTIMIZATION"],
    },
    {
        "slug": "vector-database-comparison-2024",
        "title": "2024年向量数据库选型指南：Milvus vs Qdrant vs Weaviate",
        "excerpt": "RAG系统的核心组件——向量数据库，各主流方案性能如何？本文通过索引构建时间、查询延迟、内存占用三个维度进行横向对比。",
        "tags": ["VECTOR DB", "RAG"],
    },
    {
        "slug": "rust-for-python-developers",
        "title": "Python开发者为何应该学习Rust：性能与安全的平衡之道",
        "excerpt": "Rust的所有权模型、零成本抽象和 fearless concurrency 使其成为Python生态的理想补充。本文从Python视角讲解Rust核心概念。",
        "tags": ["RUST", "PYTHON"],
    },
    {
        "slug": "edge-computing-llm-deployment",
        "title": "边缘设备部署大模型：量化、剪枝与推理加速实战",
        "excerpt": "在手机和嵌入式设备上运行LLM已成为现实。本文介绍INT4/INT8量化、GGML格式、llama.cpp等关键技术栈。",
        "tags": ["EDGE AI", "QUANTIZATION"],
    },
    {
        "slug": "kubernetes-networking-deep-dive",
        "title": "Kubernetes网络模型深度解析：从CNI到Service Mesh",
        "excerpt": "Pod-to-Pod通信、Service负载均衡、Ingress路由——K8s网络模型层层拆解，附带iptables和eBPF实现原理。",
        "tags": ["KUBERNETES", "NETWORKING"],
    },
    {
        "slug": "webassembly-future-of-web-performance",
        "title": "WebAssembly与WebGPU：Web前端性能的下一波浪潮",
        "excerpt": "Wasm GC提案推进、WebGPU跨平台图形API、WASI标准成熟——Web平台正在突破浏览器沙箱的限制。",
        "tags": ["WEBASSEMBLY", "WEBGPU"],
    },
    {
        "slug": "distributed-tracing-observability",
        "title": "分布式追踪与可观测性：OpenTelemetry最佳实践",
        "excerpt": "微服务架构下，日志、指标、追踪三位一体构成可观测性基石。本文详解OpenTelemetry的集成方式与采样策略。",
        "tags": ["OBSERVABILITY", "MICROSERVICES"],
    },
    {
        "slug": "typescript-advanced-patterns",
        "title": "TypeScript高级类型体操：从Conditional Types到Template Literals",
        "excerpt": "深入TypeScript的类型系统——条件类型、模板字面量类型、infer关键字的妙用，写出更安全、更优雅的泛型代码。",
        "tags": ["TYPESCRIPT", "PROGRAMMING"],
    },
    {
        "slug": "graph-rag-knowledge-graphs",
        "title": "Graph RAG：知识图谱与大模型的融合实践",
        "excerpt": "传统RAG在复杂推理任务中存在局限。Graph RAG引入知识图谱的结构化信息，显著提升回答的准确性和可追溯性。",
        "tags": ["GRAPH RAG", "KNOWLEDGE GRAPH"],
    },
    {
        "slug": "eBPF-system-programming",
        "title": "eBPF革命：无需修改内核即可扩展Linux系统能力",
        "excerpt": "从网络包过滤到安全监控，eBPF让开发者在内核态运行沙箱程序。本文通过实际案例演示 Cilium 和 Pixie 的使用。",
        "tags": ["EBPF", "LINUX"],
    },
    {
        "slug": "multi-modal-ai-2024",
        "title": "多模态AI技术综述：从CLIP到GPT-4V的视觉理解进化",
        "excerpt": "文本到图像、图像到文本、视频理解——多模态模型如何打破模态壁垒？本文回顾CLIP、Flamingo、LLaVA等里程碑工作。",
        "tags": ["MULTI-MODAL", "VISION"],
    },
    {
        "slug": "serverless-vs-containers",
        "title": "Serverless vs Containers：云原生架构的理性选择",
        "excerpt": "FaaS冷启动、容器编排复杂度——两者并非互斥。本文从延迟敏感型、批处理、长期运行等场景分析选型策略。",
        "tags": ["SERVERLESS", "CLOUD NATIVE"],
    },
    {
        "slug": "prompt-engineering-techniques",
        "title": "提示工程进阶：Chain-of-Thought、ToT与GoT的数学直觉",
        "excerpt": "从CoT到Tree-of-Thought再到Graph-of-Thought，提示工程技术不断突破LLM推理能力的边界。本文给出理论分析与实践对比。",
        "tags": ["PROMPT ENGINEERING", "LLM"],
    },
    {
        "slug": "data-pipeline-modern-stack",
        "title": "现代数据管道技术栈：从Kafka到dbt的端到端实践",
        "excerpt": "实时流处理、CDC变更捕获、ELT转换——构建可靠的数据管道需要哪些组件？本文给出从Source到Dashboard的完整方案。",
        "tags": ["DATA ENGINEERING", "KAFKA"],
    },
]

# 加载Cloudinary URL映射
with open(r"E:\chromeDownload\arc-portfolio\cloudinary_urls.json", "r") as f:
    cloudinary_urls = json.load(f)

# 将封面图URL分配给文章
import random
random.seed(42)
url_keys = list(cloudinary_urls.keys())
random.shuffle(url_keys)

manifest = []
for i, art in enumerate(articles):
    fname = url_keys[i % len(url_keys)]
    cover_url = cloudinary_urls[fname]
    manifest.append({
        **art,
        "cover_filename": fname,
        "cover_url": cover_url,
        "order": i + 1,
    })

output = r"E:\chromeDownload\arc-portfolio\blog_manifest.json"
with open(output, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Manifest已生成: {output}")
print(f"共 {len(manifest)} 篇文章")
for a in manifest:
    print(f"  [{a['order']}] {a['slug']} -> {a['cover_filename'][:40]}")
