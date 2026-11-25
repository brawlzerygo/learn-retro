# Learn Retro Yu-Gi-Oh!

**https://learnretro.com** · [YouTube](https://www.youtube.com/@LearnRetro) · [Instagram](https://www.instagram.com/learnretroygo/)

Learn Retro is a free place to learn and play **retro Yu-Gi-Oh! formats**: the game as it was at one moment in time, with that moment's cards, banlist and rules, frozen so the format never changes.

This repository is the live website at learnretro.com. It holds the home page, the blog, and the built copies of each format's site.

## Why it exists

Modern Yu-Gi-Oh! changes every few months, with new sets, new banlists and new best decks. Retro formats stop the clock instead. Players pick a moment they loved, agree on its card pool and banlist, and play it as it was. Once you learn a retro format, it stays learned.

The hard part is getting started. The knowledge is spread across forum posts, old rulings, Discord servers and decklist archives, and most of it assumes you already know the format. Learn Retro puts it in one place, in plain language, from your very first summon to tournament-level decks. It started as one player's study tool for Edison format and grew into a site for every retro format, starting with two.

## The formats

| Format | The moment | What's on the site |
|---|---|---|
| [Edison](https://learnretro.com/edison/) | April 2010: the March 2010 banlist, cards through Absolute Powerforce, the first Synchro era | A course from the basics to tournament play (Step 0, 101, 201, 301), a page for every card with its 2010 text and rulings, the banlist, rulings and errata, 55 deck lists, a deck builder, flashcards, a glossary, a rules page, matchups and a practice board |
| [Goat](https://learnretro.com/goat/) | Summer 2005: the April 2005 banlist and every card legal on August 17, 2005 | A course from the basics (Step 0, 101, 201), all 1,691 legal cards, the banlist, 53 deck lists from guides and tournaments, a deck builder, flashcards, a glossary, a rules page, matchups and a practice board |

More formats will follow.

## Also part of Learn Retro

- **[Play](https://play.learnretro.com):** a duel simulator where you play Edison or Goat against the computer. Its built site lives in [learn-retro-play](https://github.com/brawlzerygo/learn-retro-play).
- **[Blog](https://learnretro.com/blog/):** guides on retro formats, tier lists and banlists, each with its sources listed.
- **[YouTube](https://www.youtube.com/@LearnRetro):** the courses as video lessons, built from the same lessons as the site.

## Everything is free

There are no accounts, no paywall and no ads. Course progress and saved decks stay in your own browser. The site's code is open source.

## How the site is built

Plain HTML, CSS and JavaScript, hosted on GitHub Pages. Each format is its own source repository:

- [learn-edison](https://github.com/brawlzerygo/learn-edison): the Edison site, its rules engine and the build tools that put this site together
- [learn-goat](https://github.com/brawlzerygo/learn-goat): the Goat site

This repository is assembled from them by `build/assemble.mjs` in learn-edison: the hub at the root, then `/edison/` and `/goat/`. The blog is built from the Markdown files in `blog/posts/` by `tools/blog.mjs`. Every page is pre-rendered as its own HTML file, so each lesson, card and deck has a real address.

## Accuracy and sources

Every fact on the site and blog is meant to be checked against a source: a card's own text, an official rulebook, a format's community site or the site's own data. When something can't be confirmed, it's rewritten or left out. If you spot a mistake, please [open an issue](https://github.com/brawlzerygo/learn-retro/issues) or message us on [Instagram](https://www.instagram.com/learnretroygo/).

Credits, with thanks:

- **Edison card data, Edison card text, decks, errata and card images:** [edisonformat.net](https://edisonformat.net), the Edison community's format site
- **Edison-accurate card text and rulings:** the [mikaRulings](https://github.com/MikaMikaDE/mikaRulings) project by MikaMikaDE
- **Edison rules:** the Official Rulebook version 7.0 (on edisonformat.net) and [Time Wizard Rulings](https://timewizzardrulings.vercel.app)
- **Goat card pool, banlist and 2005 rules:** [goatformat.com](https://www.goatformat.com), the Goat community's format site
- **Goat tournament deck lists:** [Format Library](https://formatlibrary.com)
- **Card data and images not covered above, and token images:** [YGOPRODeck](https://ygoprodeck.com)
- **Card back image:** [Yugipedia](https://yugipedia.com)
- **Videos in the Edison Library:** their creators, linked on YouTube and credited on the page

Everything is written in our own words. Card data and images are stored on this site, never hotlinked.

## Privacy

The site asks before it uses any analytics. Google Analytics loads only if you click Accept on the cookie banner, and you can change your choice at any time. Details: https://learnretro.com/privacy/

## Disclaimer

The literal and graphical information presented on this site about Yu-Gi-Oh!, including Card images, Attribute, Level, Rank, Type Symbols, is copyright 4K Media Inc, a subsidiary of Konami Digital Entertainment (KDE), Inc.
This website is not produced by, endorsed by, supported by, or affiliated with 4k Media, Studio Dice, or KDE.

Yu-Gi-Oh! is a trademark of Shueisha and Konami. Learn Retro is a free, non-commercial fan project for learning the game.

## License

The site's own code is released under the MIT License (see the `LICENSE` file in [learn-edison](https://github.com/brawlzerygo/learn-edison) and [learn-goat](https://github.com/brawlzerygo/learn-goat)). The license does not cover card text, card images or other Yu-Gi-Oh! content, which belong to Konami, or the data, rulings and videos of the sources credited above, which belong to them.
