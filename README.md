[![hugo](https://user-images.githubusercontent.com/43764894/223559747-e9d7f19d-91bf-46a9-a0cb-8d6a40d3cfa3.png)](https://ntl.fyi/3P9w1mr)

# Hugo Quickstart Template

This site is basically using a customized theme of bare-bones Hugo project and deploy it to [Netlify](https://netlify.com).

Hate reading, here's a video: <https://youtu.be/t-tsRxxYdpk>

Love reading, here's blog post: <https://www.netlify.com/blog/deploy-your-hugo-app-quick/>

## Table of Contents

- [Hugo Quickstart Template](#hugo-quickstart-template)
  - [Table of Contents](#table-of-contents)
  - [Quick Setup + Deploy Option](#quick-setup--deploy-option)
  - [Regular Setup](#regular-setup)
    - [1. Cloning + Running Locally](#1-cloning--running-locally)
    - [2. Deploying](#2-deploying)
  - [Hugo + Netlify Resources](#hugo--netlify-resources)
- [Notes](#notes)
  - [Color palette](#color-palette)
  - [References](#references)

## Quick Setup + Deploy Option

Click this button and it will help you create a new repo, create a new Netlify project, and deploy!

[![Deploy to Netlify Button](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/hugo-quickstart)

Or deploy your own Hugo project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/examples/hugo&template=hugo)

_Live Example: <https://hugo-template.vercel.app>_

## Regular Setup

### 1. Cloning + Running Locally

- Clone this repo with via the command line `git clone https://github.com/fanajib5/hugo-site.git`

- Start the Hugo sever & check it out:

  - `hugo server -D`
  - go to [http://localhost:1313/](http://localhost:1313/)

  > Alternatively, you can run this locally with [the Netlify CLI](https://docs.netlify.com/cli/get-started/)'s by running the `netlify dev` command for more options like receiving a live preview to share (`netlify dev --live`) and the ability to test [Netlify Functions](https://www.netlify.com/products/functions) and [redirects](https://docs.netlify.com/routing/redirects/).

### 2. Deploying

- Install the Netlify CLI globally `npm install netlify-cli -g`

- Run `hugo`

- Then use the `netlify deploy` for a deploy preview link or `netlify deploy --prod` to deploy to production

## Hugo + Netlify Resources

Here are some resources to help you on your Hugo + Netlify coding fun!

- [Hugo on Netlify Integration Page](https://ntl.fyi/3P9w1mr)

Hope this template helps :) Happy coding 👩🏻‍💻!

---

## Notes

### Color palette

This site's color palette is Retro style from [Color Hunt](https://colorhunt.co/).

- [Retro #1](https://colorhunt.co/palette/f9f5ebe4dccfea5455002b5b)
- [Retro #2](https://colorhunt.co/palette/fde5ecfcbaade48586916db3)
- [Retro #3](https://colorhunt.co/palette/3c486bf0f0f0f9d949f45050)

## References

- Lazy loading: <https://imagekit.io/blog/lazy-loading-images-complete-guide/#using-intersection-observer-api-to-trigger-image-loads>
- Multilingual site in Hugo: <https://phrase.com/blog/posts/i18n-tutorial-how-to-go-multilingual-with-hugo/>
