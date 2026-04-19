export const BLOG_POSTS = [
  { 
    id: 1,
    title: 'Transformer 架构全解析：从 Attention 到 GPT-4',
    date: '2026-04-10',
    excerpt:
      '深入剖析 Transformer 的核心机制——Self-Attention、多头注意力与位置编码。从 Vaswani 2017 的原始论文出发，理解为何它彻底重塑了整个 AI 领域。',
    tags: ['Transformer', 'Deep Learning'],
    content: `## 一篇论文如何改变世界

2017 年 6 月，Google Brain 团队发表了《Attention Is All You Need》。这篇论文只有 15 页，却在此后几年内彻底重写了 NLP、CV、语音识别乃至蛋白质结构预测领域的规则。它的核心主张极为大胆：**抛弃所有循环结构，只用注意力机制。**

![Transformer 整体架构示意](https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Transformer%2C_full_architecture.png/500px-Transformer%2C_full_architecture.png "Transformer 架构概览")

在 Transformer 之前，序列建模的标准范式是 RNN/LSTM。它们有一个根本性的缺陷：顺序计算。处理第 t 个 token 必须等第 t-1 个 token 完成，这使得训练极难并行化。

## Self-Attention：核心计算引擎

Self-Attention 的计算分三步：

1. 将输入序列线性投影为三组矩阵：Query（Q）、Key（K）、Value（V）
2. 计算注意力权重：scores = QK^T / √d_k，然后通过 softmax 归一化
3. 用权重对 V 加权求和：Attention(Q,K,V) = softmax(QK^T / √d_k) · V

其中 **√d_k 是关键的缩放因子**。当 d_k 较大时，点积的方差增大，softmax 会进入梯度极小的饱和区。除以 √d_k 使方差保持稳定。

> "The dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients." —— Vaswani et al., 2017

## 多头注意力：并行的多视角

单头注意力只能在一个表示子空间中捕捉关系。多头注意力（Multi-Head Attention）将 Q/K/V 分别投影到 h 个独立子空间，并行执行 h 次 Attention，最后拼接并线性变换。

不同的注意力头可以专注于不同类型的关系：句法依存、语义相似性、指代消解等。这种分工在大量可视化研究中得到了验证。

## 位置编码：注入时序信息

Transformer 对序列中所有位置的处理完全对称——它本身不知道 token 的顺序。为此，原始论文使用正弦/余弦函数注入位置信息：

\`\`\`
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
\`\`\`

这种设计的优雅之处：对于固定偏移量 k，PE(pos+k) 可以表示为 PE(pos) 的线性函数，模型能轻松学习相对位置关系。

## 从原始 Transformer 到 GPT 系列

GPT 系列采用仅解码器（Decoder-only）架构，通过**因果掩码（Causal Mask）**实现自回归语言建模——每个 token 只能看到它之前的上下文，训练目标是最大化序列的联合概率。

![神经网络训练可视化](https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200 "大规模神经网络训练过程")

**规模定律（Scaling Laws）** 的发现表明：在足够多的数据和计算资源下，模型性能随参数量的对数线性增长——这一发现成为了大语言模型竞赛的理论基础。

## 为什么 Transformer 如此成功？

- **并行训练**：所有位置同时计算，充分利用 GPU/TPU 的并行能力
- **长程依赖**：任意两位置之间的路径长度为 O(1)，而 RNN 是 O(n)
- **可扩展性**：架构简单，易于堆叠，参数量可扩展到万亿级别
- **迁移学习**：预训练-微调范式在几乎所有任务上都取得了突破性进展`,
  },
  {
    id: 2,
    title: '什么是 AI Agent？从工具调用到自主决策',
    date: '2026-04-01',
    excerpt:
      'AI Agent 不只是一个会聊天的模型，它能主动调用工具、规划多步任务、感知环境并作出决策。本文从零解释 Agent 的架构与工作原理。',
    tags: ['Agent', 'LLM'],
    content: `## Agent 与普通 LLM 的本质区别

一个普通的大语言模型（LLM）是一个**无状态的函数**：给定输入，产生输出，然后结束。它不会主动获取信息，不会执行代码，不会记住上一次对话。

AI Agent 在此基础上增加了四个核心能力：**感知（Perception）、规划（Planning）、行动（Action）、记忆（Memory）**。它能够将复杂目标拆解为多个步骤，在每一步选择合适的工具，根据工具返回的结果调整后续计划，直到完成任务。

![AI Agent 工作流程](https://plus.unsplash.com/premium_photo-1726079247110-5e593660c7b2?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D "Agent 感知-规划-行动循环")

## ReAct：思考与行动的交织

2022 年提出的 **ReAct 框架**（Reasoning + Acting）是目前最广泛使用的 Agent 范式。它让模型在每一步先进行"思考"（Thought），再决定"行动"（Action），最后观察"结果"（Observation），形成循环：

\`\`\`
Thought: 用户想知道今天北京的天气，我需要调用天气 API
Action: search_weather(city="Beijing", date="today")
Observation: {"temp": 22, "weather": "晴", "humidity": 45}
Thought: 已获取结果，可以回答用户了
Answer: 今天北京天气晴，气温 22°C，湿度 45%
\`\`\`

这种"思维链"让模型的推理过程变得透明和可调试。

## 工具调用（Function Calling）

现代 LLM 的工具调用能力是 Agent 的核心基础设施。你可以向模型注册一批工具，模型根据用户意图决定调用哪个工具、传入什么参数：

\`\`\`json
{
  "name": "get_weather",
  "description": "获取指定城市的实时天气",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string" },
      "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] }
    }
  }
}
\`\`\`

模型不直接执行函数，而是返回结构化的调用请求，由外部代码真正执行，并将结果返回给模型继续推理。

## 记忆系统：短期 vs 长期

Agent 的记忆分为两类：

- **短期记忆（Context Window）**：当前对话的所有内容在上下文窗口内，随会话结束而消失
- **长期记忆（External Memory）**：通过向量数据库将历史信息嵌入存储，检索时通过语义相似度召回相关片段

RAG（Retrieval-Augmented Generation）本质上就是给 LLM 配备了一个可检索的外部记忆库。

## 多 Agent 系统

单个 Agent 的能力有限。**多 Agent 系统**让多个专门化的 Agent 协同工作：一个负责搜索信息，一个负责写代码，一个负责审核质量，一个负责整合输出。AutoGen、LangGraph、CrewAI 等框架都在探索这一方向。

> Agent 不是 LLM 的替代品，而是 LLM 的延伸——它让语言模型从一个"知识库"变成了一个"行动者"。`,
  },
  {
    id: 3,
    title: '什么是 AI Skill？让模型掌握可复用的能力单元',
    date: '2026-03-18',
    excerpt:
      'Skill 是 AI 系统中的能力封装单元——比 Prompt 更结构化，比 Fine-tuning 更灵活。本文解释 Skill 的概念、设计原则，以及它与 Plugin、Tool 的区别。',
    tags: ['Skill', 'AI System'],
    content: `## 从 Prompt 到 Skill 的演进

最简单的 AI 能力扩展方式是写一个好的 Prompt。但 Prompt 难以复用、难以版本管理、难以测试。当你需要在数十个场景中使用"数据分析"能力时，复制粘贴 Prompt 显然不是工程化的解法。

**Skill（技能）** 的概念就是为了解决这个问题而生的——它是一个**封装了特定能力的、可复用的、有明确输入输出规范的模块**。

![AI Skill 模块化架构](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200 "Skill 的模块化设计")

## Skill 的四个核心要素

一个设计良好的 Skill 应该包含：

- **名称与描述**：让 AI Orchestrator 能够理解这个 Skill 的用途，在需要时自动选择调用它
- **输入规范（Input Schema）**：定义接受什么类型的输入，约束参数格式
- **执行逻辑（Implementation）**：可以是一段 Prompt、一个代码函数、一个 API 调用，或三者的组合
- **输出规范（Output Schema）**：定义返回格式，确保下游 Skill 能够正确消费结果

## Semantic Kernel 中的 Skill

微软的 **Semantic Kernel** 框架是 Skill 概念最具代表性的工程实现：

\`\`\`python
# 语义函数 Skill：用 Prompt 实现摘要能力
summarize_skill = kernel.create_semantic_function(
    prompt_template="请用三句话总结：{{$input}}",
    function_name="Summarize",
    skill_name="TextProcessing",
    max_tokens=200
)

# 原生函数 Skill：用代码实现天气查询
@sk_function(description="获取城市实时天气")
def get_weather(city: str) -> str:
    return weather_api.fetch(city)
\`\`\`

Orchestrator 可以自动将这些 Skill 组合成复杂工作流，就像乐高积木一样。

## Skill vs Plugin vs Tool

这三个概念经常被混用，但有细微差异：

- **Tool**：最底层，指一个可调用的函数或 API，无自然语言描述，需代码显式调用
- **Plugin**：在 ChatGPT Plugin 语境下，指一个有 OpenAPI 规范描述的外部服务，强调**外部集成**
- **Skill**：在 Agent 框架语境下，封装了完整能力（Prompt + 代码逻辑 + 上下文管理），强调**内部可组合性**

> 如果把 AI 系统比作人，Tool 是手脚，Plugin 是与外界沟通的接口，而 Skill 是大脑中习得的能力——可以被调用、被组合、被持续改进。

## Skill 的设计原则

1. **单一职责**：每个 Skill 只做一件事，做好一件事
2. **无副作用优先**：尽可能设计成纯函数，相同输入产生相同输出
3. **失败可恢复**：明确定义失败模式和降级策略
4. **可观测**：记录输入输出，方便调试和评估
5. **版本化**：像代码一样管理 Skill 的版本，支持回滚`,
  },
  {
    id: 4,
    title: '什么是 AI Plugin？扩展 LLM 能力边界的插件系统',
    date: '2026-03-05',
    excerpt:
      'ChatGPT Plugin 在 2023 年让"让 AI 上网"成为现实。Plugin 架构背后的设计哲学是什么？MCP 协议如何将其标准化？',
    tags: ['Plugin', 'MCP'],
    content: `## Plugin 的诞生背景

2023 年 3 月，OpenAI 推出了 ChatGPT Plugin 系统。这是一个历史性时刻：语言模型第一次可以在对话过程中实时访问互联网、执行代码、查询数据库。

LLM 的两大先天局限被一举击破：**知识截止日期（Training Cutoff）** 和 **无法与外部世界交互**。

![ChatGPT Plugin 生态](https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&q=80&w=1200 "Plugin 将 LLM 与外部世界连接")

## Plugin 的技术架构

一个 ChatGPT Plugin 由三个核心部分组成：

### OpenAPI 规范（API Schema）

Plugin 通过标准的 OpenAPI 3.0 规范描述自己能做什么：

\`\`\`yaml
openapi: 3.0.1
info:
  title: 天气查询 Plugin
  description: 获取全球任意城市的实时天气数据
paths:
  /weather:
    get:
      operationId: getWeather
      summary: 查询城市天气
      parameters:
        - name: city
          in: query
          required: true
          schema:
            type: string
\`\`\`

### AI Plugin 元数据（ai-plugin.json）

这个文件是 Plugin 的"自我介绍"，包含名称、描述、认证方式、API 端点地址等信息。

### 实际的后端服务

普通的 REST API 服务，可以用任何语言和框架实现。

## MCP：Plugin 的标准化演进

ChatGPT Plugin 的问题是与 OpenAI 生态深度绑定。2024 年底，Anthropic 发布了 **MCP（Model Context Protocol）**，建立跨平台的 AI 工具调用标准。

MCP 定义了三种核心能力：

- **Resources**：模型可以读取的数据源（文件、数据库、API 返回值）
- **Tools**：模型可以调用的函数（类似 Function Calling）
- **Prompts**：可复用的 Prompt 模板，由服务端提供

MCP 的设计哲学是"让任何应用都能成为 AI 的工具"。一个 MCP Server 可以是本地进程，也可以是远程 HTTP 服务，通过标准协议与任何兼容的 AI 客户端通信。

## Plugin 生态的挑战

- **安全性**：模型可能被恶意 Plugin 诱导执行有害操作（Prompt Injection）
- **可靠性**：外部服务的延迟和可用性影响整体体验
- **权限管控**：如何界定 AI 可以代表用户执行哪些操作？
- **发现性**：数以千计的 Plugin 中，如何让模型准确选择正确的那个？

> Plugin 是 AI 走出"语言游戏"进入真实世界的第一步。但要让这一步走得稳，还需要整个生态在安全、标准化、用户体验上持续演进。`,
  },
  {
    id: 5,
    title: '大模型微调完全指南：LoRA、QLoRA 与 RLHF',
    date: '2026-02-18',
    excerpt:
      '预训练模型如何变成专用助手？从全参数微调到参数高效微调（PEFT），再到基于人类反馈的强化学习（RLHF），一文厘清主流微调技术的原理与适用场景。',
    tags: ['Fine-tuning', 'LoRA', 'RLHF'],
    content: `## 为什么需要微调？

GPT-4、Claude、Llama 等基础模型经过海量文本预训练后，具备了强大的语言理解与生成能力。但它们是"通才"——对特定领域的专业性不足，对特定任务格式的遵从度不够。

**微调（Fine-tuning）** 就是用特定领域数据对预训练模型进行二次训练，使其在目标任务上表现更好。

![模型微调流程](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200 "从预训练模型到专用助手")

## LoRA：低秩适配的优雅解法

**LoRA（Low-Rank Adaptation）** 是目前最流行的 PEFT 方法。核心思想：**预训练模型的权重更新量是低秩的**。

不直接更新原始权重矩阵 W，而是引入两个小矩阵 A（d×r）和 B（r×k）的乘积来近似更新量：

\`\`\`
W' = W + ΔW = W + BA
其中秩 r ≪ min(d, k)
\`\`\`

只有 A 和 B 需要训练，原始权重 W 冻结不变。当 r=8、d=4096 时，参数量从 1670 万压缩到约 65536，**减少约 256 倍**。

## QLoRA：将微调门槛降到消费级显卡

**QLoRA** 在 LoRA 基础上加入量化：将模型权重从 16-bit 压缩到 4-bit 存储（NF4 格式）。这使得在单张 RTX 3090（24GB 显存）上微调 65B 模型成为可能。

三个关键技术：

- **NF4 量化**：专为正态分布权重设计的 4-bit 数据类型，减少量化误差
- **双重量化**：对量化常数本身再次量化，进一步节省内存
- **分页优化器**：使用 NVIDIA 统一内存，在 GPU 内存溢出时自动换页到 CPU

## RLHF：让模型符合人类价值观

**RLHF（Reinforcement Learning from Human Feedback）** 是 ChatGPT、Claude 等对话模型能够"听话"的核心技术，分三个阶段：

1. **监督微调（SFT）**：收集高质量示范数据，对预训练模型做标准微调
2. **奖励模型训练（RM）**：让人工标注者对模型的多个输出进行排序，训练能预测人类偏好的打分模型
3. **PPO 强化学习**：以奖励模型的分数为信号，用 PPO 算法更新语言模型

> RLHF 的本质是将"人类认为好的回答"这一模糊概念，通过奖励模型转化为可优化的数值信号，再通过强化学习让 LLM 朝这个方向进化。

## 如何选择微调策略？

- **数据量 < 1000 条**：优先考虑 Prompt Engineering，微调容易过拟合
- **数据量 1000~100K 条，资源有限**：QLoRA 首选，性价比最高
- **数据量充足，追求极致性能**：全参数微调或大 rank 的 LoRA
- **需要对齐价值观和行为风格**：RLHF 或 DPO（Direct Preference Optimization）`,
  },
  {
    id: 6,
    title: 'RAG 技术深度解析：让 AI 拥有可更新的长期记忆',
    date: '2026-02-03',
    excerpt:
      'RAG（检索增强生成）是解决 LLM 知识截止问题的主流方案。从向量嵌入、近似最近邻搜索，到 Rerank 与 HyDE，本文覆盖 RAG 系统的完整技术栈。',
    tags: ['RAG', 'Vector DB'],
    content: `## LLM 的"记忆"问题

大语言模型的知识来自训练数据，一旦训练结束，知识就被"冻结"了。2024 年发布的模型不知道 2025 年发生的事情；专有企业知识库中的文档，模型更是一无所知。

**RAG（Retrieval-Augmented Generation）** 的思路是：不修改模型本身，而是在每次推理时动态检索相关文档，塞入上下文，让模型基于最新信息回答。

![RAG 系统架构](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=1200 "RAG 的检索-生成流程")

## 向量嵌入：语义的数字化表达

RAG 的核心是将文本转化为高维向量（Embedding），使得**语义相似的文本在向量空间中距离相近**。

嵌入模型（如 OpenAI text-embedding-3-large、BGE、E5）接收文本，输出固定维度（如 1536 维）的浮点向量，捕捉文本的语义信息而非字面词汇。

"苹果公司发布了新款 iPhone"和"Apple 推出最新智能手机"在向量空间中非常接近，尽管没有任何共同词汇。

## RAG 管道的完整流程

\`\`\`
[离线索引阶段]
原始文档 → 文本分块（Chunking）→ Embedding → 向量数据库

[在线查询阶段]
用户问题 → Embedding → ANN 检索 Top-K → Rerank → 构造 Prompt → LLM → 回答
\`\`\`

主流向量数据库：

- **Pinecone**：全托管云服务，开箱即用，适合快速原型
- **Weaviate**：开源，支持混合搜索（向量 + 关键词），可自托管
- **Chroma**：轻量级本地向量数据库，适合开发调试
- **pgvector**：PostgreSQL 扩展，适合已有 PG 基础设施的团队

## 高级优化：Rerank 与 HyDE

**Rerank（重排序）**：ANN 检索召回 Top-50 候选后，用更强的交叉编码器（Cross-encoder）对每个候选与查询的相关性精确打分，取 Top-5 送入 LLM。

**HyDE（Hypothetical Document Embeddings）**：先让 LLM 生成一个"假设性答案"，用这个假设答案的 Embedding 去检索，而非原始问题。由于假设答案与真实答案的语义空间更接近，检索质量显著提升。

> RAG 不是银弹。当知识库极大、文档质量参差不齐、或问题需要跨多个文档综合推理时，RAG 表现会下滑。GraphRAG、LongContext 等方向正在尝试突破这些局限。`,
  },
]

export const GALLERY_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    category: 'Architecture',
    title: '极简住宅',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1776410866978-171cc3033431?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Workspace',
    title: '海边风景',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=800',
    category: 'Landscape',
    title: '山间迷雾',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=800',
    category: 'Object',
    title: '工业设计',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
    category: 'Interior',
    title: '留白空间',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1507149833265-60c372daea22?auto=format&fit=crop&q=80&w=800',
    category: 'Nature',
    title: '海洋细节',
  },
]

export const PROJECTS = [
  {
    id: 2,
    title: 'AI Blog — 深度学习技术分享',
    desc: '个人技术博客，聚焦 LLM、Agent、RAG、Fine-tuning 等前沿 AI 话题，持续更新原创深度文章与代码实践。',
    tech: ['Next.js', 'TypeScript', 'Tailwind', 'Vercel'],
    github: 'https://github.com/Xavier7776',
    demo: '#',
  },
  {
    id: 3,
    title: 'TimeMachine — Mamba 时序实验',
    desc: '将 Mamba（选择性状态空间模型）应用于超长序列时间序列预测的实验性项目，探索其相对 Transformer 的效率-性能权衡。',
    tech: ['Mamba', 'SSM', 'CUDA', 'Python'],
    github: 'https://github.com/Atik-Ahamed/TimeMachine/tree/main/TimeMachine_supervised',
    demo: '#',
  },
]

export const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000',
    title: '探索 AI 前沿',
    subtitle: '从 Transformer 到 Agent，记录深度学习领域的思考与实践。',
  },
  {
    img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000',
    title: '从模型到系统',
    subtitle: '理解大模型的工作原理，构建真正有用的 AI 应用。',
  },
  {
    img: 'https://test.fukit.cn/autoupload/f/T92c4TLzNe5wsXnw_T86nFaMnouKReN3spbQz7x5YEI/20260419/UECJ/1440X1080/mmexport1776566665633.jpg',
    title: '从工作到生活',
    subtitle: '王盈瑞的奇妙之旅。',
  },
]
