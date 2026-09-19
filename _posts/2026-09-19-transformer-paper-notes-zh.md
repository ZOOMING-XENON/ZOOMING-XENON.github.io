---
layout: post
title: "Transformer 论文笔记"
subtitle: "从数据流出发理解原始 Transformer 的结构、公式与训练方法"
tags: [transformer, deep-learning, paper-notes]
author: ZhexiFang
language: zh-CN
language_name: 中文
language_order: 1
translation_key: transformer-paper-notes
permalink: /transformer-paper-notes/
mathjax: true
---

Transformer 模型舍弃了传统的 RNN/CNN，用 attention 作为序列中不同位置交换信息的主要方式。更准确地说，原论文中的模型由 multi-head attention、逐位置的前馈神经网络（feed-forward network）、残差连接和 Layer Normalization 共同组成，并不是只有 attention。

multi-head attention 和单头 attention 的主要区别，也不是简单地避免 softmax 把信息“均一化”。它的意义在于：同一组输入可以通过多套不同的投影矩阵，分别在不同的表示子空间中计算 attention。有的 head 可能更关注局部搭配，有的可能更关注长距离依赖；至于每个 head 最终学到什么，是训练出来的，并没有人工规定。

Transformer 是一个典型的 encoder-decoder 模型。原论文首先将它用于机器翻译：encoder 读取源语言句子，decoder 根据 encoder 的结果和已经生成的目标词，逐步预测下一个词。它在保持翻译效果的同时去掉了 RNN 的递归计算，因此训练时可以更充分地并行，这一点其实比“结构简单”更准确。相应的代价是标准 self-attention 要显式计算 $n\times n$ 的分数矩阵，时间和显存开销会随序列长度近似按 $O(n^2)$ 增长。

## 整体架构

Transformer 的整体架构如图：

![Transformer 原论文中的 encoder-decoder 架构](/assets/img/transformer-notes/transformer-architecture.png)

左边是 encoder，右边是 decoder。原论文将 encoder 和 decoder 都堆叠了 6 层。这里的“堆叠 6 层”不是把同一层循环 6 次，而是 6 个结构相同、参数各自独立的层。

下文继续按照数据流动的顺序理解模型。需要先补充两点：

1. 原论文的 input 和 output 都是自然语言，因为任务是翻译；但 Transformer 架构本身并不要求输入输出一定是自然语言。
2. 训练 decoder 时，目标句子会整体右移一位。例如目标句子是“我 / 爱 / 学习 / `<eos>`”，decoder 的输入类似于“`<bos>` / 我 / 爱 / 学习”，它在每个位置预测后面的那个 token。推理时没有完整答案可用，只能从 `<bos>` 开始一个 token 一个 token 地生成。

## Token embedding

输入的文字首先会被分词（tokenization），然后执行 embedding。原论文在 3.4 节中的意思是：输入 token 和输出 token 都通过可学习的 embedding 映射为 $d_{\mathrm{model}}$ 维向量；decoder 的最终输出再经过线性变换和 softmax，得到下一个 token 的概率分布。

大概流程是：字符串“今天我在图书馆读书”被 tokenizer 切成若干 token，例如“今天 / 我 / 在 / 图书馆 / 读书”。这只是为了说明流程，实际如何切分取决于 tokenizer，token 不一定刚好是一个完整的词。之后每个 token 会被映射成词表中的一个 id，例如“我”对应 19，“图书馆”对应 2994。

假设词表大小为 $V=30000$，原论文的 $d_{\mathrm{model}}=512$，那么可以学习一个 embedding 矩阵：

$$
E\in\mathbb{R}^{V\times d_{\mathrm{model}}}
=\mathbb{R}^{30000\times512}.
$$

token id 就是在这个矩阵中取出对应的一行。因此，单个 token 的 embedding 是一个 $512$ 维向量；含有 $n$ 个 token 的句子会得到矩阵：

$$
X_{\mathrm{emb}}\in\mathbb{R}^{n\times d_{\mathrm{model}}}.
$$

这里每一行对应一个 token，每一列对应表示空间中的一个特征维度。真实代码中通常还有 batch 维度，张量形状是 $[B,n,d_{\mathrm{model}}]$。为了让后面的公式好看，本文都先省略 batch 维度。

原论文还有两个容易略过的细节：

- embedding 向量在与位置编码相加前会乘以 $\sqrt{d_{\mathrm{model}}}$；
- 两个 embedding 层与最终 softmax 前的线性层共享同一套权重。这里的两个 embedding 层指 encoder 的输入 embedding 和 decoder 的输出语言 embedding。原论文使用共享词表，因此可以这样做。

## Positional encoding

顺着 encoder 和 decoder 的输入向上，可以看到 positional encoding 模块。

![Positional Encoding](/assets/img/transformer-notes/positional-encoding.png)

因为 self-attention 本身只根据向量内容计算关系。如果把 token 的顺序完全打乱，同时也相应地打乱输出，它不会仅凭 attention 计算知道谁在前、谁在后。所以必须显式加入位置信息。

原论文使用固定的正弦、余弦位置编码：

$$
\operatorname{PE}(\mathrm{pos},2i)=\sin\left(\frac{\mathrm{pos}}{10000^{2i/d_{\mathrm{model}}}}\right),
$$

$$
\operatorname{PE}(\mathrm{pos},2i+1)=\cos\left(\frac{\mathrm{pos}}{10000^{2i/d_{\mathrm{model}}}}\right).
$$

其中 $\mathrm{pos}$ 是 token 在序列中的位置，$i$ 表示第几组正弦/余弦频率，取值为

$$
i=0,1,\ldots,\frac{d_{\mathrm{model}}}{2}-1.
$$

所以我原先写“$i$ 不能简单理解为 dimension”这个直觉基本是对的，但可以再精确一点：$i$ 是频率组的下标，一组 $i$ 对应两个维度 $2i$ 和 $2i+1$。当 $d_{\mathrm{model}}=512$ 时，$i$ 的取值是 $0\sim255$，最后覆盖位置向量的 $0\sim511$ 维，而不是 $0\sim256$。

例如，对于 $\mathrm{pos}=3$ 的 token：

$$
\begin{aligned}
\operatorname{PE}(3,0)&=\sin(3),\\
\operatorname{PE}(3,1)&=\cos(3),\\
\operatorname{PE}(3,2)&=\sin\left(\frac{3}{10000^{2/512}}\right),\\
\operatorname{PE}(3,3)&=\cos\left(\frac{3}{10000^{2/512}}\right),\\
&\ \vdots\\
\operatorname{PE}(3,510)&=\sin\left(\frac{3}{10000^{510/512}}\right),\\
\operatorname{PE}(3,511)&=\cos\left(\frac{3}{10000^{510/512}}\right).
\end{aligned}
$$

这样会得到一个 512 维的位置向量。它与 token embedding 是逐元素相加，而不是拼接：

$$
X_0=\sqrt{d_{\mathrm{model}}}X_{\mathrm{emb}}+\mathrm{PE}.
$$

相加后维度仍然是 $n\times512$，因此后面的每个子层都可以保持统一的 $d_{\mathrm{model}}$。论文还提到，作者试过学习式位置编码，结果和正弦位置编码接近；选择正弦编码，是因为它有希望外推到训练时没有见过的更长序列。

![加入位置编码后的输入](/assets/img/transformer-notes/positional-encoding-example.png)

## Scaled Dot-Product Attention

设加上位置编码后的矩阵为 $X$。在 self-attention 中，$X$ 会分别乘三个可学习的投影矩阵，得到 $Q$、$K$、$V$。

![Scaled Dot-Product Attention](/assets/img/transformer-notes/scaled-dot-product-attention.png)

- $Q$（query）：当前位置拿什么内容去“询问”其他位置。
- $K$（key）：每个位置拿什么内容与 query 匹配。
- $V$（value）：匹配出权重后，实际被加权汇总的信息。

Q、K、V 并不是输入向量天然具有的三种属性。它们的含义来自 attention 公式中的分工，投影矩阵则在反向传播中逐渐学到适合各自分工的表示。

我参考的 B 站讲解对 attention 的设计动机和为什么分成 Q/K/V 解释得比较直观：[Transformer 中的 Attention 讲解](https://www.bilibili.com/video/BV1eoh5zbEfj)。

### 1. 生成 Q、K、V

先看单个 self-attention head。若输入为

$$
X=
\begin{bmatrix}
x_1\\
x_2\\
\vdots\\
x_n
\end{bmatrix}
\in\mathbb{R}^{n\times d_{\mathrm{model}}},
$$

其中 $x_j\in\mathbb{R}^{d_{\mathrm{model}}}$ 是第 $j$ 个 token 的行向量，那么

$$
W^Q\in\mathbb{R}^{d_{\mathrm{model}}\times d_k},\qquad
W^K\in\mathbb{R}^{d_{\mathrm{model}}\times d_k},\qquad
W^V\in\mathbb{R}^{d_{\mathrm{model}}\times d_v}.
$$

注意：投影矩阵的第一维是 $d_{\mathrm{model}}$，不是 token 数 $n$。模型必须能处理不同长度的句子，所以可学习参数的大小不能依赖当前句长。

随后：

$$
Q=XW^Q\in\mathbb{R}^{n\times d_k},
$$

$$
K=XW^K\in\mathbb{R}^{n\times d_k},
$$

$$
V=XW^V\in\mathbb{R}^{n\times d_v}.
$$

$d_q$ 和 $d_k$ 必须相等，才能计算 $QK^T$。一般直接把共同的维度写成 $d_k$。$d_v$ 不必等于 $d_{\mathrm{model}}$；在原论文的每个 head 中，$d_k=d_v=64$。

### 2. 计算 query 与 key 的匹配分数

$$
S=QK^T\in\mathbb{R}^{n\times n}.
$$

$S_{ij}=q_i\cdot k_j$ 表示第 $i$ 个 query 与第 $j$ 个 key 的匹配分数。点积较大，表示这两个经过学习投影后的向量方向比较一致，因此第 $i$ 个位置可能应该多读取第 $j$ 个位置的信息。

这里要修正我原先的理解：点积大并不直接说明两个 token 在句子中的位置近，也不等同于原始 embedding 的欧氏距离近。位置关系已经通过 positional encoding 混入输入，而最终什么样的语法或语义关系会得到高分，是 $W^Q$、$W^K$ 学出来的。

![Q 与 K 的匹配关系](/assets/img/transformer-notes/qk-matching.png)

在 encoder self-attention 中，query 和 key 的长度相同，所以 $S$ 是 $n\times n$ 方阵。但 attention 并不要求分数矩阵一定是方阵。以 encoder-decoder cross-attention 为例，如果目标序列长 $n_t$，源序列长 $n_s$，那么分数矩阵的形状是 $n_t\times n_s$。

### 3. 为什么除以 $\sqrt{d_k}$

缩放后的分数为

$$
\frac{QK^T}{\sqrt{d_k}}.
$$

原论文给出的解释是：假设 $q$ 和 $k$ 的每个分量互相独立、均值为 0、方差为 1，那么点积

$$
q\cdot k=\sum_{r=1}^{d_k}q_rk_r
$$

是 $d_k$ 项之和，其方差约为 $d_k$，标准差约为 $\sqrt{d_k}$。$d_k$ 较大时，点积容易落入数值很大的区域，softmax 会变得过于尖锐，梯度也会很小。除以 $\sqrt{d_k}$ 后，分数的尺度重新回到比较稳定的范围。

所以这里不是“矩阵相乘把每个数字平方了”，而是许多个随机乘积相加后，方差会随维度累积。

### 4. Mask

![Attention mask](/assets/img/transformer-notes/attention-mask.png)

更完整的公式是：

$$
\operatorname{Attention}(Q,K,V)
=\operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V.
$$

对于不允许被关注的位置，mask 矩阵 $M$ 中对应的值设为 $-\infty$；其他位置设为 0。经过 softmax 后，被屏蔽位置的权重就变为 0。

常见的 mask 有两类：

- causal mask：用于 decoder 的 masked self-attention。第 $t$ 个位置只能看到 $1\sim t$，不能偷看未来的正确答案，因此矩阵在视觉上保留下三角部分。
- padding mask：屏蔽为了凑齐 batch 长度而补上的 `<pad>`。encoder self-attention、decoder self-attention 和 cross-attention 都可能需要它，具体取决于输入中哪里存在 padding。

Figure 1 中三个 attention 模块的情况是：encoder self-attention 不需要 causal mask；decoder self-attention 必须使用 causal mask；cross-attention 也不需要 causal mask，因为 encoder 的整句输出本来就允许被 decoder 读取。但后两者仍然可能叠加 padding mask。

### 5. Softmax 和 Value 加权

softmax 应该沿 key 所在的维度进行。对于某一个 query，要把它对应的所有 key 分数归一化，使这一行权重的和为 1：

$$
A_{ij}=
\frac{\exp(S_{ij})}
{\sum_{j'}\exp(S_{ij'})}.
$$

如果 attention 分数张量的形状是 $[n_q,n_k]$，那么在 NumPy/PyTorch 的习惯写法里通常是 `axis=-1` 或 `dim=-1`，对于这个二维矩阵也就是 `axis=1`，不是 `axis=0`。

最后：

$$
O=AV\in\mathbb{R}^{n_q\times d_v}.
$$

输出的第 $i$ 行，是所有 value 向量按照第 $i$ 个 query 的 attention 权重求出的加权和。

![Attention 权重与 Value 相乘](/assets/img/transformer-notes/attention-value.png)

![Scaled Dot-Product Attention 的矩阵计算](/assets/img/transformer-notes/attention-matrix-computation.png)

## Multi-Head Attention

上面讲的 scaled dot-product attention 只是一个 head。multi-head attention 的做法是把输入同时投影到 $h$ 组不同的 Q/K/V 子空间，各自计算 attention，然后把结果拼接起来。

为了避免符号混乱，先把送进 attention 子层的三组输入记为 $X_Q$、$X_K$、$X_V$：

$$
\mathrm{head}_i=\operatorname{Attention}(X_QW_i^Q,X_KW_i^K,X_VW_i^V),
$$

$$
\operatorname{MultiHead}(X_Q,X_K,X_V)
=\operatorname{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)W^O.
$$

每个 head 的投影矩阵为：

$$
W_i^Q,W_i^K\in\mathbb{R}^{d_{\mathrm{model}}\times d_k},\qquad
W_i^V\in\mathbb{R}^{d_{\mathrm{model}}\times d_v}.
$$

原论文中：

$$
h=8,\qquad d_k=d_v=\frac{d_{\mathrm{model}}}{h}=\frac{512}{8}=64.
$$

这里的 64 维不是从原来的 512 维中直接挑出 64 维。每个投影矩阵都会读取完整的 512 维，再把它们线性组合成一套新的 64 维表示。

因此，每个 head 的输出形状是 $n_q\times64$。沿最后一个特征维拼接 8 个 head 后：

$$
\operatorname{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_8)
\in\mathbb{R}^{n_q\times512}.
$$

最后：

$$
W^O\in\mathbb{R}^{hd_v\times d_{\mathrm{model}}}
=\mathbb{R}^{512\times512}.
$$

$W^O$ 的作用不只是“把维度变回去”。它会对各个 head 输出的特征做一次可学习的混合，并把结果映射回 $d_{\mathrm{model}}$，这样才能与子层输入做残差相加。如果没有 $W^O$，不同 head 的结果只是被机械地摆在一起，后续无法在这个子层末尾重新组合它们。

![Multi-Head Attention](/assets/img/transformer-notes/multi-head-attention.png)

三个 attention 模块的 Q/K/V 来源也不一样：

| 模块 | Query 来自 | Key、Value 来自 | 作用 |
| --- | --- | --- | --- |
| encoder self-attention | encoder 当前层输入 | encoder 当前层输入 | 源句内部互相读取信息 |
| decoder masked self-attention | decoder 当前层输入 | decoder 当前层输入 | 只读取已经生成的目标 token |
| encoder-decoder cross-attention | decoder 上一个子层的输出 | encoder 最后一层输出 | 生成目标词时读取源句信息 |

尤其是 cross-attention：$Q$ 来自 decoder，$K$ 和 $V$ 来自 encoder。这正是 encoder 把源句信息传给 decoder 的位置。

## Add & Norm

按照数据流动顺序，attention 后面是 Add & Norm。原论文对每个子层使用：

$$
\operatorname{LayerNorm}(x+\operatorname{Sublayer}(x)).
$$

其中 `Sublayer` 可以是 multi-head attention，也可以是 feed-forward network。论文还会先对子层输出做 dropout，再与 $x$ 相加。这个结构现在常被称为 Post-LN，因为 LayerNorm 放在残差相加之后；很多现代 Transformer 会改用 Pre-LN，但那已经不是 Figure 1 中的原始结构了。

残差连接不是因为“第 6 层已经够好，第 7、8 层反而一定下降”。更准确的理解是：残差给信息和梯度提供了一条直接通路。如果某个子层暂时没有学到有用变换，网络至少比较容易保留 $x$；反向传播时，梯度也不必完全穿过一连串复杂变换。这会让深层网络更容易优化。

LayerNorm 则对每个 token 的特征维做归一化，再用可学习参数进行缩放和平移。它不依赖 batch 中其他样本的统计量，比较适合长度不同的序列。

另外，残差相加要求两边形状一致。这也是每个子层最后都回到 $d_{\mathrm{model}}=512$ 的直接原因之一。

## Position-wise Feed-Forward Network

![Feed-Forward Network](/assets/img/transformer-notes/position-wise-ffn.png)

每个 encoder/decoder 层还包含一个逐位置的前馈网络：

$$
\operatorname{FFN}(x)=\max(0,xW_1+b_1)W_2+b_2.
$$

原论文使用 ReLU，维度变化为：

$$
512\ \longrightarrow\ 2048\ \longrightarrow\ 512.
$$

“逐位置”指的是：同一个 FFN 独立作用于序列的每一个 token，不在 token 之间做混合；同一层的所有位置共享这套 $W_1,W_2$，不同 Transformer 层则使用不同参数。从实现角度看，它也可以理解为两个卷积核大小为 1 的卷积。

multi-head attention 中的 softmax 的确已经带来非线性，所以不能说 FFN 是整个模型唯一的非线性来源。但两者分工不同：attention 主要负责不同 token 之间的信息读取和混合；FFN 负责在每个 token 内部对 512 个特征做更充分的非线性变换，并通过 2048 维的中间层增加表示容量。简单记就是：attention 混合位置，FFN 变换特征。

## Decoder 与最终输出

decoder 的每一层比 encoder 多一个 cross-attention 子层，顺序是：

1. masked self-attention，只读取当前目标位置及其之前的 token；
2. cross-attention，用 decoder 表示查询 encoder 的最终输出；
3. position-wise FFN。

每个子层外面都有残差连接和 LayerNorm。经过 6 层 decoder 后，会得到每个目标位置的隐藏向量：

$$
H\in\mathbb{R}^{n_t\times d_{\mathrm{model}}}.
$$

![Linear 与 Softmax 输出层](/assets/img/transformer-notes/linear-softmax.png)

随后通过线性层投影到词表大小：

$$
Z=HW_{\mathrm{vocab}}^T+b,
\qquad
Z\in\mathbb{R}^{n_t\times V}.
$$

$Z$ 叫作 logits。对每个位置的词表维度做 softmax，就得到下一个 token 的概率：

$$
p(y_t=v)=\frac{\exp(Z_{t,v})}
{\sum_{v'=1}^{V}\exp(Z_{t,v'})}.
$$

训练时，所有目标位置可以并行计算；causal mask 保证每个位置看不到未来答案。推理时则是自回归的：先预测一个 token，把它接回 decoder 输入，再预测下一个，直到生成 `<eos>`。实际翻译可以使用 greedy decoding，也可以使用 beam search。原论文报告结果时使用了 beam search。

## 损失函数、优化器与正则化

![训练与输出示意](/assets/img/transformer-notes/training-output.png)

### 损失函数

机器翻译本质上是在每个位置做一次词表分类，所以训练目标是 token-level cross-entropy。若 $q_{t,v}$ 是位置 $t$ 的目标分布，$p_{t,v}$ 是模型预测概率，则：

$$
\mathcal{L}
=-\sum_t\sum_{v=1}^{V}q_{t,v}\log p_{t,v}.
$$

padding 位置不参与 loss。普通 one-hot 标签只给正确 token 概率 1，其他 token 概率 0；原论文额外用了 label smoothing，系数 $\epsilon_{\mathrm{ls}}=0.1$。直观上，它把少量概率从正确类别分给其他类别，避免模型把预测做得过度自信。按常见写法：

$$
q_{t,v}=
\begin{cases}
1-\epsilon_{\mathrm{ls}}, & v=y_t,\\
\frac{\epsilon_{\mathrm{ls}}}{V-1}, & v\ne y_t.
\end{cases}
$$

论文指出 label smoothing 会让 perplexity 变差一些，因为模型不再拼命把正确词概率推向 1，但会提高准确率和 BLEU。

### Optimizer 和学习率

原论文使用 Adam：

$$
\beta_1=0.9,\qquad
\beta_2=0.98,\qquad
\epsilon=10^{-9}.
$$

学习率不是常数，而是：

$$
\mathrm{lr}=d_{\mathrm{model}}^{-1/2}\cdot
\min\left(t^{-1/2},\;t\cdot w^{-3/2}\right).
$$

其中 $t$ 表示当前训练步数，$w=4000$ 表示 warmup 步数。前 4000 步学习率线性上升，避免训练刚开始参数还很不稳定时走得太猛；之后按步数的平方根倒数衰减。

此外，base model 使用 $P_{\mathrm{drop}}=0.1$ 的 dropout。按照论文 5.4 节的描述，dropout 被用在各子层输出，以及 embedding 与位置编码之和上。训练配置里最需要记住的几项就是：Adam 的特殊参数、4000 步 warmup、0.1 dropout 和 0.1 label smoothing。

## 最后按数据流重新串一次

以一次机器翻译为例，完整流程可以压缩成下面这条线：

$$
\text{源句 token}
\rightarrow \text{embedding + positional encoding}
\rightarrow 6\text{ 层 encoder}
\rightarrow \text{源句上下文表示},
$$

$$
\text{右移后的目标 token}
\rightarrow \text{embedding + positional encoding}
\rightarrow \text{masked self-attention}
\rightarrow \text{cross-attention 读取 encoder}
\rightarrow \text{FFN}
\rightarrow 6\text{ 层 decoder}
\rightarrow \text{linear + softmax}
\rightarrow \text{下一个 token 的概率}.
$$

我觉得理解 Transformer 时最容易混淆的是两件事：第一，Q/K/V 是一套计算分工，不是三种提前定义好的语义；第二，encoder 和 decoder 之间真正发生信息交换的地方，是 decoder 中间的 cross-attention。把这两点想明白，Figure 1 里面的大部分箭头就能顺着走通了。

## 参考资料

- Vaswani et al., 2017, [Attention Is All You Need（arXiv）](https://arxiv.org/abs/1706.03762)
- [Attention Is All You Need（NeurIPS 论文 PDF）](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)
- [本文参考的 B 站讲解](https://www.bilibili.com/video/BV1eoh5zbEfj)
