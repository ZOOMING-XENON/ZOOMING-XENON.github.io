---
layout: post
title: "How to build a personal website like this?"
tags: [tutorial]
author: ZhexiFang
---

# Getting Started

Since I didn't need anything particularly flashy for this site—and I wasn't interested in buying a domain or renting a server—I went with GitHub Pages' free hosting. I forked the classic template:

https://github.com/daattali/beautiful-jekyll

It's very easy to get started; there are plenty of tutorials online, and its clean page style matched what I had in mind.

# Site Planning

First, I sketched out a rough structure based on my own ideas:

![](https://iwf1j732xi0.feishu.cn/space/api/box/stream/download/asynccode/?code=M2MzNmQ3YzYxNjhiZDg0NmJjMWU3MjYzMDg5ZDQzYjNfcm5YaXdOeFN4UGN2dGdVV3VYNTVsVEpQamhpMnFlbFVfVG9rZW46WWNGeGJqNm1Wb1k1Tkx4a0dwUmNEc2Ribm9kXzE3ODAyMzYxODE6MTc4MDIzOTc4MV9WNA)

# Discussing with AI

![](https://iwf1j732xi0.feishu.cn/space/api/box/stream/download/asynccode/?code=NDYzMGQ5NGU1OGZiMWVjMzRiZjE1ZjNmN2VmMDcxNmNfQjdyZVppdWx6cDZiWDVjT2VxUkNlclRqRGI5OVg3dmhfVG9rZW46RG85amI0MWVNb1p2Rll4M0x4cmNra01Pbk1jXzE3ODAyMzYxODE6MTc4MDIzOTc4MV9WNA)

The refined architecture became:

```Shell
Top navigation (every item is clickable; no "Home" dropdown)
├── Home  →  /            (landing page: short About preview + latest News cards)
├── About →  /aboutme     (full personal introduction)
├── Blog  →  /blog        (all posts; filterable by tag)
└── Resources (dropdown)
        ├── Books      → /resources/books
        ├── Movies     → /resources/movies
        └── Activities → /resources/activities

Footer
└── Contact
        ├── Email      (natively supported via social-network-links)
        └── Xiaohongshu (custom icon link required)
```

# Push and Take a Look

![](https://iwf1j732xi0.feishu.cn/space/api/box/stream/download/asynccode/?code=MzZjMjg1MDJlYzQwZDI4NGEwZDM3ZGM0OThjNGUwOTJfQlkwQ0ppMlZyZ0xaazNsampXdlpLVGZtOHZGME9xYWdfVG9rZW46Q25mR2JER2t2b2R3MDd4UU9jVWNMdndKbkVVXzE3ODAyMzYxODE6MTc4MDIzOTc4MV9WNA)

Opus 4.8 is strong—the architecture was spot-on, and it followed instructions really well.

I found that committing and pushing after every small change was too tedious, so I set up local `jekyll serve` for live preview.

# Next: Adding Some Flair

I looked for inspiration on Spline. Even without a membership to copy code directly, you can screenshot designs and have AI recreate them.

![](https://iwf1j732xi0.feishu.cn/space/api/box/stream/download/asynccode/?code=Y2RmZTVhYzRlOTFiNDZmMGRiNGEzMjIxYjBjMTFkYWZfYUlvRzlSZVdEQnRJUFdlZ01CcndOMmgydWJ5aVBKZjNfVG9rZW46R1VYcWJKM01TbzdYdzB4ek1nMmNsc2xubjljXzE3ODAyMzYxODE6MTc4MDIzOTc4MV9WNA)

Code is cheap—give me your prompt.

After choosing the tech stack, Opus 4.8 helped me implement this simple interactive dot-grid effect:

![](https://iwf1j732xi0.feishu.cn/space/api/box/stream/download/asynccode/?code=MDlhZjgxMDBiYTQzMWMwMGFkODEzOGYyYWEyYmJjNzRfeXVnTXNTV0pTNFA0Z0FXVWhFSGlmQWhPNk5iVmxadzZfVG9rZW46TG5LdGIwVHlUb1lNaFp4emV0WWM5eEhIblJCXzE3ODAyMzYxODE6MTc4MDIzOTc4MV9WNA)

Next up: endless content writing and filling in the details...
