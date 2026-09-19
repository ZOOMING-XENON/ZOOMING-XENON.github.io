---
layout: post
title: "Transformer Paper Notes"
subtitle: "Understanding the original Transformer through its data flow, equations, and training setup"
tags: [transformer, deep-learning, paper-notes]
author: ZhexiFang
language: en
language_name: English
language_order: 2
translation_key: transformer-paper-notes
permalink: /en/transformer-paper-notes/
hide_from_feed: true
mathjax: true
---

The Transformer discards the recurrent and convolutional structures used by traditional RNNs and CNNs, and uses attention as the main way for different positions in a sequence to exchange information. More precisely, the model in the original paper is built from multi-head attention, position-wise feed-forward networks, residual connections, and Layer Normalization. It is not literally made of attention alone.

The main difference between multi-head attention and single-head attention is also not simply that it prevents softmax from “averaging away” information. The important part is that the same input can be projected through several different sets of learned matrices, allowing attention to operate in different representation subspaces. One head may pay more attention to local word combinations while another may capture long-range dependencies. What each head actually learns is determined during training rather than specified by hand.

The Transformer is a typical encoder-decoder model. The original paper first applied it to machine translation: the encoder reads a source-language sentence, and the decoder predicts the next target token from the encoder output and the target tokens generated so far. By removing the recurrence of an RNN, the model makes training much more parallelizable. I think this is a more accurate description of its advantage than simply calling the architecture “simple.” The trade-off is that standard self-attention explicitly constructs an $n\times n$ score matrix, so its time and memory usage grow approximately as $O(n^2)$ with sequence length.

## Overall architecture

The overall Transformer architecture is shown below:

![The encoder-decoder architecture from the original Transformer paper](/assets/img/transformer-notes/transformer-architecture.png)

The encoder is on the left and the decoder is on the right. In the original paper, both sides contain six stacked layers. “Six stacked layers” does not mean running the exact same layer six times in a loop. The layers share the same structure, but each has its own parameters.

The rest of this note follows the flow of data through the model. Two details are worth clarifying first:

1. The inputs and outputs in the original paper are both natural language because the task is translation, but the Transformer architecture itself does not require both sides to be text.
2. During decoder training, the target sentence is shifted one position to the right. If the target is “I / love / learning / `<eos>`,” the decoder input looks like “`<bos>` / I / love / learning,” and each position predicts the following token. At inference time, the complete answer is unavailable, so generation starts from `<bos>` and proceeds one token at a time.

## Token embedding

The input text is first tokenized and then embedded. Section 3.4 of the paper says that learned embeddings convert both input and output tokens into $d_{model}$-dimensional vectors. A linear transformation followed by softmax then converts the decoder output into probabilities for the next token.

As a simplified example, the string “今天我在图书馆读书” may be split into tokens such as “今天 / 我 / 在 / 图书馆 / 读书.” This is only an illustration: the actual split depends on the tokenizer, and a token does not have to correspond to a complete word. Each token is then mapped to an id in the vocabulary, such as 19 for “我” and 2994 for “图书馆.”

Suppose the vocabulary size is $V=30000$ and, as in the original paper, $d_{model}=512$. The model learns an embedding matrix:

$$
E\in\mathbb{R}^{V\times d_{model}}
=\mathbb{R}^{30000\times512}.
$$

Looking up a token id simply selects the corresponding row of this matrix. The embedding of one token is therefore a 512-dimensional vector, while a sentence containing $n$ tokens gives:

$$
X_{emb}\in\mathbb{R}^{n\times d_{model}}.
$$

Each row represents one token, and each column is one feature dimension in the representation space. Real implementations normally include a batch dimension, so the tensor shape is $[B,n,d_{model}]$. I omit the batch dimension below to keep the equations readable.

The original paper includes two details that are easy to overlook:

- each embedding vector is multiplied by $\sqrt{d_{model}}$ before positional encoding is added;
- the two embedding layers and the linear transformation before softmax share the same weight matrix. The two embedding layers are the encoder input embedding and decoder target-language embedding. The paper uses a shared vocabulary, which makes this weight sharing possible.

## Positional encoding

Following the encoder and decoder inputs upward in the architecture diagram, the next component is positional encoding.

![Positional Encoding](/assets/img/transformer-notes/positional-encoding.png)

Self-attention computes relationships from vector content. If the tokens and corresponding outputs were permuted together, attention alone would have no way to know which token originally came first. Position information therefore has to be added explicitly.

The original paper uses fixed sine and cosine positional encodings:

$$
PE(pos,2i)=\sin\left(\frac{pos}{10000^{2i/d_{model}}}\right),
$$

$$
PE(pos,2i+1)=\cos\left(\frac{pos}{10000^{2i/d_{model}}}\right).
$$

Here, $pos$ is the token's position in the sequence and $i$ indexes a sine/cosine frequency pair:

$$
i=0,1,\ldots,\frac{d_{model}}{2}-1.
$$

My original intuition that “$i$ should not simply be understood as the dimension” was mostly correct, but it can be stated more precisely: $i$ indexes a frequency pair, and each $i$ corresponds to dimensions $2i$ and $2i+1$. When $d_{model}=512$, $i$ ranges from 0 to 255, covering dimensions 0 through 511 rather than 0 through 256.

For example, for a token at $pos=3$:

$$
\begin{aligned}
PE(3,0)&=\sin(3),\\
PE(3,1)&=\cos(3),\\
PE(3,2)&=\sin\left(\frac{3}{10000^{2/512}}\right),\\
PE(3,3)&=\cos\left(\frac{3}{10000^{2/512}}\right),\\
&\ \vdots\\
PE(3,510)&=\sin\left(\frac{3}{10000^{510/512}}\right),\\
PE(3,511)&=\cos\left(\frac{3}{10000^{510/512}}\right).
\end{aligned}
$$

This produces a 512-dimensional position vector. It is added element by element to the token embedding rather than concatenated with it:

$$
X_0=\sqrt{d_{model}}X_{emb}+PE.
$$

The result still has shape $n\times512$, which allows every later sublayer to preserve the same $d_{model}$. The paper also reports that learned positional embeddings produced nearly identical results. The authors chose sinusoidal encoding because it might extrapolate to sequence lengths not seen during training.

![Input after adding positional encoding](/assets/img/transformer-notes/positional-encoding-example.png)

## Scaled Dot-Product Attention

Let the matrix after positional encoding be $X$. In self-attention, $X$ is multiplied by three learned projection matrices to produce $Q$, $K$, and $V$.

![Scaled Dot-Product Attention](/assets/img/transformer-notes/scaled-dot-product-attention.png)

- $Q$ (query): what the current position uses to “ask” other positions for information.
- $K$ (key): what each position exposes for comparison with a query.
- $V$ (value): the information that is actually retrieved and combined after the attention weights are determined.

Q, K, and V are not three inherent properties already present in an input vector. Their meaning comes from the roles they play in the attention equation, while the projection matrices gradually learn representations suited to those roles through backpropagation.

The Bilibili video I referenced gives an intuitive explanation of the motivation behind attention and why it is split into Q/K/V: [Transformer Attention explanation](https://www.bilibili.com/video/BV1eoh5zbEfj).

### 1. Producing Q, K, and V

Consider one self-attention head. Let the input be:

$$
X=
\begin{bmatrix}
x_1\\
x_2\\
\vdots\\
x_n
\end{bmatrix}
\in\mathbb{R}^{n\times d_{model}},
$$

where $x_j\in\mathbb{R}^{d_{model}}$ is the row vector for token $j$. The projection matrices are:

$$
W^Q\in\mathbb{R}^{d_{model}\times d_k},\qquad
W^K\in\mathbb{R}^{d_{model}\times d_k},\qquad
W^V\in\mathbb{R}^{d_{model}\times d_v}.
$$

The first dimension of each projection matrix is $d_{model}$, not the token count $n$. The model must handle sentences of different lengths, so the size of a learned parameter cannot depend on the current sequence length.

Then:

$$
Q=XW^Q\in\mathbb{R}^{n\times d_k},
$$

$$
K=XW^K\in\mathbb{R}^{n\times d_k},
$$

$$
V=XW^V\in\mathbb{R}^{n\times d_v}.
$$

$d_q$ and $d_k$ have to be equal so that $QK^T$ is defined; the shared dimension is normally written simply as $d_k$. There is no requirement that $d_v=d_{model}$. In each head of the original Transformer, $d_k=d_v=64$.

### 2. Matching queries with keys

$$
S=QK^T\in\mathbb{R}^{n\times n}.
$$

$S_{ij}=q_i\cdot k_j$ is the matching score between query $i$ and key $j$. A larger dot product means that the two vectors point in more similar directions after their learned projections, so position $i$ may need to read more information from position $j$.

One part of my original explanation needs to be corrected: a large dot product does not directly mean that two tokens are close in the sentence, nor does it mean that their original embeddings have a small Euclidean distance. Positional information has already been mixed into the input through positional encoding, and the kinds of syntactic or semantic relationships that receive high scores are learned by $W^Q$ and $W^K$.

![Matching Q with K](/assets/img/transformer-notes/qk-matching.png)

In encoder self-attention, queries and keys have the same sequence length, so $S$ is an $n\times n$ square matrix. Attention score matrices do not have to be square in general. In encoder-decoder cross-attention, if the target sequence has length $n_t$ and the source sequence has length $n_s$, the score matrix has shape $n_t\times n_s$.

### 3. Why divide by $\sqrt{d_k}$?

The scaled scores are:

$$
\frac{QK^T}{\sqrt{d_k}}.
$$

The paper's explanation is as follows. Suppose every component of $q$ and $k$ is independent, has mean 0, and has variance 1. Their dot product is:

$$
q\cdot k=\sum_{r=1}^{d_k}q_rk_r.
$$

This is a sum of $d_k$ terms, so its variance is approximately $d_k$ and its standard deviation is approximately $\sqrt{d_k}$. When $d_k$ is large, the dot products can become large in magnitude, pushing softmax into a very sharp region with extremely small gradients. Dividing by $\sqrt{d_k}$ brings the score scale back to a more stable range.

The issue is therefore not that matrix multiplication “squares every number.” It is that the variance accumulates when many random products are added together.

### 4. Masking

![Attention mask](/assets/img/transformer-notes/attention-mask.png)

A more complete attention equation is:

$$
Attention(Q,K,V)
=softmax\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V.
$$

For a connection that is not allowed, the corresponding entry in the mask $M$ is set to $-\infty$; allowed entries are set to 0. After softmax, the weight of a masked position becomes 0.

Two common masks are:

- causal mask: used in the decoder's masked self-attention. Position $t$ may only see positions $1$ through $t$, and cannot look at future correct answers. Visually, this retains the lower-triangular part of the matrix.
- padding mask: hides `<pad>` tokens added to make the sequences in a batch the same length. Encoder self-attention, decoder self-attention, and cross-attention may all need it, depending on where padding is present.

For the three attention modules in Figure 1, encoder self-attention does not need a causal mask; decoder self-attention must use one; and cross-attention does not need one because the decoder is allowed to read the encoder's complete source-sentence representation. Any of these modules may still combine its attention scores with a padding mask.

### 5. Softmax and the weighted sum of Values

Softmax is applied along the key dimension. For one query, the scores over all keys are normalized so that the weights in that row sum to 1:

$$
A_{ij}=
\frac{\exp(S_{ij})}
{\sum_{j'}\exp(S_{ij'})}.
$$

If the attention score tensor has shape $[n_q,n_k]$, the usual NumPy/PyTorch notation is `axis=-1` or `dim=-1`. For this two-dimensional matrix, that is `axis=1`, not `axis=0`.

Finally:

$$
O=AV\in\mathbb{R}^{n_q\times d_v}.
$$

Row $i$ of the output is a weighted sum of all value vectors, using the attention weights of query $i$.

![Multiplying attention weights by Value](/assets/img/transformer-notes/attention-value.png)

![Matrix computation in Scaled Dot-Product Attention](/assets/img/transformer-notes/attention-matrix-computation.png)

## Multi-Head Attention

The scaled dot-product attention above is only one head. Multi-head attention projects the input into $h$ different Q/K/V subspaces, computes attention independently in each one, and concatenates the results.

To avoid overloading the notation, let the three inputs to the attention sublayer be $X_Q$, $X_K$, and $X_V$:

$$
head_i=Attention(X_QW_i^Q,X_KW_i^K,X_VW_i^V),
$$

$$
MultiHead(X_Q,X_K,X_V)
=Concat(head_1,\ldots,head_h)W^O.
$$

The projection matrices for each head are:

$$
W_i^Q,W_i^K\in\mathbb{R}^{d_{model}\times d_k},\qquad
W_i^V\in\mathbb{R}^{d_{model}\times d_v}.
$$

In the original paper:

$$
h=8,\qquad d_k=d_v=\frac{d_{model}}{h}=\frac{512}{8}=64.
$$

These 64 dimensions are not selected directly from the original 512 dimensions. Each projection reads all 512 input features and learns a linear combination that produces a new 64-dimensional representation.

The output of each head therefore has shape $n_q\times64$. Concatenating eight heads along the final feature dimension gives:

$$
Concat(head_1,\ldots,head_8)
\in\mathbb{R}^{n_q\times512}.
$$

Finally:

$$
W^O\in\mathbb{R}^{hd_v\times d_{model}}
=\mathbb{R}^{512\times512}.
$$

$W^O$ does more than merely “restore the dimensions.” It performs a learned mixing of the features produced by different heads and maps the result back to $d_{model}$, making it possible to add the sublayer output to its input through a residual connection. Without $W^O$, the head outputs would only be mechanically placed next to each other, with no final recombination inside the sublayer.

![Multi-Head Attention](/assets/img/transformer-notes/multi-head-attention.png)

The three attention modules also receive Q/K/V from different places:

| Module | Query comes from | Key and Value come from | Purpose |
| --- | --- | --- | --- |
| encoder self-attention | current encoder-layer input | current encoder-layer input | let positions in the source sentence exchange information |
| decoder masked self-attention | current decoder-layer input | current decoder-layer input | read only target tokens that have already been generated |
| encoder-decoder cross-attention | output of the preceding decoder sublayer | output of the final encoder layer | read the source sentence while generating a target token |

Cross-attention is especially important: $Q$ comes from the decoder, while $K$ and $V$ come from the encoder. This is the point where information actually passes from the encoder to the decoder.

## Add & Norm

Following the data flow, each attention block is followed by Add & Norm. The original paper applies the following operation around every sublayer:

$$
LayerNorm(x+Sublayer(x)).
$$

Here, `Sublayer` can be multi-head attention or a feed-forward network. The paper also applies dropout to the sublayer output before adding it to $x$. This arrangement is now commonly called Post-LN because LayerNorm comes after the residual addition. Many modern Transformers use Pre-LN instead, but that is not the structure shown in the original Figure 1.

The residual connection is not there because “six layers are already good enough and layers seven or eight must make the result worse.” A more accurate explanation is that it gives both information and gradients a direct path through the network. If a sublayer has not yet learned a useful transformation, the network can still preserve $x$ relatively easily; during backpropagation, gradients also do not have to pass entirely through a long sequence of complicated transformations. This makes a deep network easier to optimize.

LayerNorm normalizes the feature dimensions of each token and then applies learned scaling and shifting parameters. It does not depend on statistics from other examples in the batch, making it suitable for sequences of varying lengths.

Residual addition also requires both sides to have the same shape. This is one direct reason why every sublayer eventually maps its output back to $d_{model}=512$.

## Position-wise Feed-Forward Network

![Feed-Forward Network](/assets/img/transformer-notes/position-wise-ffn.png)

Every encoder and decoder layer also contains a position-wise feed-forward network:

$$
FFN(x)=\max(0,xW_1+b_1)W_2+b_2.
$$

The original paper uses ReLU, with dimensions:

$$
512\ \longrightarrow\ 2048\ \longrightarrow\ 512.
$$

“Position-wise” means that the same FFN is applied independently to every token and does not mix information between token positions. All positions in one layer share the same $W_1$ and $W_2$, while different Transformer layers have different parameters. From an implementation point of view, the FFN can also be described as two convolutions with kernel size 1.

The softmax inside multi-head attention already introduces nonlinearity, so the FFN is not the model's only nonlinear component. The two modules have different jobs, however: attention mainly reads and mixes information across token positions, while the FFN performs a richer nonlinear transformation across the 512 features within each token. Its 2048-dimensional hidden layer also increases the model's representational capacity. My simplest way to remember the distinction is: attention mixes positions; the FFN transforms features.

## The decoder and final output

Each decoder layer has one more sublayer than an encoder layer. Its order is:

1. masked self-attention, which reads only the current and earlier target tokens;
2. cross-attention, which uses decoder representations to query the encoder's final output;
3. a position-wise FFN.

Every sublayer is wrapped by a residual connection and LayerNorm. After six decoder layers, the model has one hidden vector for every target position:

$$
H\in\mathbb{R}^{n_t\times d_{model}}.
$$

![Linear and Softmax output layers](/assets/img/transformer-notes/linear-softmax.png)

A linear layer then projects each vector to the vocabulary size:

$$
Z=HW_{vocab}^T+b,
\qquad
Z\in\mathbb{R}^{n_t\times V}.
$$

$Z$ contains the logits. Applying softmax over the vocabulary dimension at each position gives the probability of the next token:

$$
p(y_t=v)=\frac{\exp(Z_{t,v})}
{\sum_{v'=1}^{V}\exp(Z_{t,v'})}.
$$

During training, every target position can be computed in parallel; the causal mask prevents it from seeing future answers. Inference is autoregressive: predict one token, append it to the decoder input, predict the next token, and continue until `<eos>` is produced. Translation can use greedy decoding or beam search. The results in the original paper were obtained with beam search.

## Loss, optimizer, and regularization

![Training and output overview](/assets/img/transformer-notes/training-output.png)

### Loss function

Machine translation is a vocabulary classification problem at every target position, so the training objective is token-level cross-entropy. If $q_{t,v}$ is the target distribution at position $t$ and $p_{t,v}$ is the predicted probability, then:

$$
\mathcal{L}
=-\sum_t\sum_{v=1}^{V}q_{t,v}\log p_{t,v}.
$$

Padding positions do not contribute to the loss. A regular one-hot label assigns probability 1 to the correct token and 0 to every other token. The original paper additionally uses label smoothing with $\epsilon_{ls}=0.1$. Intuitively, it moves a small amount of probability mass from the correct class to the other classes, preventing the model from becoming excessively confident. In a common formulation:

$$
q_{t,v}=
\begin{cases}
1-\epsilon_{ls}, & v=y_t,\\
\frac{\epsilon_{ls}}{V-1}, & v\ne y_t.
\end{cases}
$$

The paper notes that label smoothing slightly hurts perplexity because the model no longer tries to push the correct token's probability all the way to 1, but it improves accuracy and BLEU score.

### Optimizer and learning rate

The original paper uses Adam with:

$$
\beta_1=0.9,\qquad
\beta_2=0.98,\qquad
\epsilon=10^{-9}.
$$

The learning rate is not constant:

$$
lrate=d_{model}^{-0.5}\cdot
\min\left(step\_num^{-0.5},\;
step\_num\cdot warmup\_steps^{-1.5}\right).
$$

Here, $warmup\_steps=4000$. The learning rate increases linearly during the first 4000 steps, avoiding overly aggressive updates while the parameters are still unstable, and then decays proportionally to the inverse square root of the step number.

The base model also uses dropout with $P_{drop}=0.1$. According to Section 5.4 of the paper, dropout is applied to each sublayer's output and to the sum of embeddings and positional encodings. The training details most worth remembering are the unusual Adam parameters, 4000 warmup steps, 0.1 dropout, and 0.1 label smoothing.

## Putting the data flow together one last time

For machine translation, the complete process can be compressed into the following two paths:

$$
\text{source tokens}
\rightarrow \text{embedding + positional encoding}
\rightarrow 6\text{ encoder layers}
\rightarrow \text{contextual source representation},
$$

$$
\text{shifted target tokens}
\rightarrow \text{embedding + positional encoding}
\rightarrow \text{masked self-attention}
\rightarrow \text{cross-attention over the encoder}
\rightarrow \text{FFN}
\rightarrow 6\text{ decoder layers}
\rightarrow \text{linear + softmax}
\rightarrow \text{next-token probabilities}.
$$

I think two points cause most of the confusion when first learning the Transformer. First, Q/K/V describe three computational roles rather than three kinds of predefined semantics. Second, the decoder's cross-attention is the place where information actually moves from the encoder to the decoder. Once these two points are clear, most of the arrows in Figure 1 become much easier to follow.

## References

- Vaswani et al., 2017, [Attention Is All You Need (arXiv)](https://arxiv.org/abs/1706.03762)
- [Attention Is All You Need (NeurIPS paper PDF)](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)
- [The Bilibili explanation referenced in this note](https://www.bilibili.com/video/BV1eoh5zbEfj)
