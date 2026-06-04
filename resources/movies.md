---
layout: page
title: Movies
subtitle: The Films that I found thought-provoking
---

<style>
.movie {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  margin-bottom: 3rem;
}
.movie .movie-poster {
  flex: 0 0 260px;
  max-width: 260px;
}
.movie .movie-poster img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
}
.movie .movie-info {
  flex: 1;
}
.movie .movie-info h2 {
  margin-top: 0;
}
/* Narrow screens: stack vertically */
@media (max-width: 640px) {
  .movie {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .movie .movie-poster {
    flex-basis: auto;
    max-width: 70%;
  }
}
</style>

<div class="movie">
  <div class="movie-poster">
    <img src="/assets/img/movie_the_big_short.jpg" alt="The Big Short">
    <img src="/assets/img/movie_the_big_short2.jpg" alt="The Big Short - Poster 2" style="margin-top: 0.75rem;">
  </div>
  <div class="movie-info" markdown="1">
## The Big Short

Beyond the wealth of financial knowledge it imparts — futures, CDOs, subprime mortgages and more — the film struck me in two particular ways.

The first is a reflection on the morality of finance itself: was the victory of the short sellers truly just? Banks always seem to come out on top (Lehman aside). Economic bubbles are an obviously flawed state of society, yet when they burst, it is ordinary people who bear the cost. As Ben Rickert says in the film, *"Every 1% rise in unemployment means 40,000 more deaths."* And yet, short selling is fundamentally a mechanism for correcting mispriced value.

The second is about intellectual independence. In life, I often encounter people who tell me not to do this or that — yet I believe my own approach is right. When the market is clearly collapsing but B-rated bond prices are somehow still rising, the protagonist reflects that perhaps those who are wrong will never understand why they were wrong. Finding the balance between following the crowd and being stubbornly contrarian takes genuine thought — though the film suggests it can all be worked out through rigorous research and calculating expected values.
  </div>
</div>
