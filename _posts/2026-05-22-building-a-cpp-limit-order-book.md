---
layout: post
title: "News: Building a C++ Limit Order Book from Scratch"
subtitle: "Diving into market microstructure and HFT-style engineering"
tags: [news, cpp, quant, lob]
author: ZhexiFang
---

A quick update on what I've been working on lately: I'm building a **Limit Order Book (LOB)** project in modern C++ as a way to break into the quantitative trading world. The LOB is the central data structure behind every electronic exchange — NYSE, CME, Binance — and it's the core module of every trading system at firms like Jane Street, Citadel, and Two Sigma.

### What is it?

A C++ implementation of a **Level-3 limit order book** with a matching engine, written from the ground up alongside a self-authored guidebook. The project is structured to mirror the engineering trade-offs an HFT system actually makes — not just "make it work," but "make it work under microsecond latency."

### Highlights so far

- **Three-layer architecture**: hash-map-based price levels with explicit best-bid/best-ask tracking, hand-rolled doubly linked lists per level for FIFO time priority, and an `order_id → node` index for O(1) cancellation.
- **Why not `std::map` / `std::set`?** Red-black trees scatter nodes across the heap, killing cache locality. The project explores array-indexed price levels and memory-pool-backed lists to get true O(1) hot paths.
- **Matching engine** following strict price-time priority, with support for limit orders, market orders, partial fills, and cancels.
- **Roadmap**: order modification and advanced order types, performance tuning, and a lock-free, C++20-flavored architecture.

### Where I am

Currently working through **Chapter 6 — order modification and advanced order types**. After that comes the fun part: latency profiling, cache-aware layouts, and lock-free queues.

### Why I'm doing this

LOB engineering sits at the intersection of low-level systems work and market microstructure, which is exactly the combination I want to be strong in. Beyond writing code, the goal is to be able to *explain* every design choice — why a `std::list` is the wrong default, why price-time priority is incentive-compatible, why a clean cancel path matters more than a clever insert.

The guidebook (in Chinese, written with Opus 4.7 as a study partner) will keep evolving as I move through the remaining chapters. More updates soon.
