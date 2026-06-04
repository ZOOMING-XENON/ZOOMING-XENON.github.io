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

![](/assets/img/post-website-plan.png)

# Discussing with AI

![](/assets/img/post-website-ai-discuss.png)

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

![](/assets/img/post-website-preview.png)

Opus 4.8 is strong—the architecture was spot-on, and it followed instructions really well.

I found that committing and pushing after every small change was too tedious, so I set up local `jekyll serve` for live preview.

# Next: Adding Some Flair

I looked for inspiration on Spline. Even without a membership to copy code directly, you can screenshot designs and have AI recreate them.

![](/assets/img/post-website-spline.png)

Code is cheap—give me your prompt.

After choosing the tech stack, Opus 4.8 helped me implement this simple interactive dot-grid effect:

Next up: endless content writing and filling in the details...
