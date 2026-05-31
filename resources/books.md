---
layout: page
title: Books
subtitle: The Books that I found thought-provoking
---

<style>
.book {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  margin-bottom: 2.5rem;
}
.book .book-cover {
  flex: 0 0 180px;
  max-width: 180px;
}
.book .book-cover img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.book .book-info {
  flex: 1;
}
.book .book-info h2 {
  margin-top: 0;
}
/* 窄屏自动堆叠为上下布局 */
@media (max-width: 576px) {
  .book {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .book .book-cover {
    flex-basis: auto;
    max-width: 60%;
  }
}
</style>

<div class="book">
  <div class="book-cover">
    <img src="/assets/img/a-practical-guide-to-quantitative-finance-interviews.jpg" alt="A Practical Guide to Quantitative Finance Interviews">
  </div>
  <div class="book-info" markdown="1">
## A Practical Guide to Quantitative Finance Interviews
by Xinfeng Zhou

This book covers many brain teasers that I really enjoy.
Moreover, it contains basic knowledge about Calculus and Linear Algebra. And it further promotes my understanding in Stochastic Process and Stochastic Calculus.

**Useful links:** [github repo](https://github.com/geniayuan/datasciencecoursera/blob/master/%5BXinfeng%20Zhou%5DA%20practical%20Guide%20to%20quantitative%20finance%20interviews.pdf "book repo")
  </div>
</div>

<div class="book">
  <div class="book-cover">
    <img src="/assets/img/Fifty-Challenging-Problems-in-Probability-with-Solutions.png" alt="Fifty Challenging Problems in Probability with Solutions">
  </div>
  <div class="book-info" markdown="1">
## Fifty Challenging Problems in Probability with Solutions
by Frederick Mosteller

Through this book I realize daily life is so rich with incidents that is counterintuitive.
  </div>
</div>

<div class="book">
  <div class="book-cover">
    <img src="/assets/img/books_steve_jobs.webp" alt="Steve Jobs">
  </div>
  <div class="book-info" markdown="1">
## Steve Jobs
by Walter Isaacson
  </div>
</div>
