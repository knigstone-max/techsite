---
title: "Zerto's founders are back: Dreeze comes out of stealth with $33M so the whole app, not just the data, survives an attack"
date: 2026-11-15
slug: dreeze-zerto-founders-33-million
category: tech-news
excerpt: "Brothers Ziv and Oded Kedem, who sold Zerto to HPE for $374 million, have started Dreeze with Avi Raichel. The company raised a $33 million seed round (about ₪105.6 million) led by Norwest and Bessemer, and is already selling a platform that brings entire cloud applications back online, not just their data."
image: img/posts/dreeze-33m-seed.webp
image_alt: "The text $33M in large letters wrapped in colorful brushstrokes of blue, yellow and pink on a dark background"
image_credit: "Image: Dreeze"
image_credit_url: "https://www.dreeze.com/blog/dreeze-comes-out-of-stealth/"
source_links:
  - "https://www.dreeze.com/blog/dreeze-comes-out-of-stealth/"
  - "https://www.calcalistech.com/ctechnews/article/rkkeose0fe"
  - "https://www.bvp.com/news/dreeze-pioneering-application-revival-for-the-agentic-age"
---

Anyone who has lived through a ransomware attack or a major cloud outage knows the moment. The backup worked, the data is back, and the system still won't start. Permissions, keys, network settings and connections between services are missing, and someone has to put it all back together by hand, sometimes for days. That gap is what Dreeze, a new Israeli company that came out of stealth on November 10, is built around.

## Who's behind it

Dreeze was founded in 2025 by brothers Ziv and Oded Kedem together with Avi Raichel, and all three have been in this business a long time. The Kedems founded Kashya, sold to EMC in 2006, and then Zerto, which made disaster recovery software for virtual and cloud environments and was bought by HPE in 2021 for $374 million (about ₪1.2 billion). Raichel was Zerto's CIO and, before that, VP of infrastructure at Amdocs.

The round: a $33 million seed (about ₪105.6 million), co-led by Norwest and Bessemer Venture Partners, with Claltech taking part. The company already has 70 employees across Israel, the US and Canada, and the money will go to product development and growing sales and marketing.

## What it does

Dreeze calls its approach Application Revival. The idea is that a modern cloud application depends on far more than its database: infrastructure, configuration, identities, secrets and keys, and connections to other services. All of it has to come back together, and in the right order.

![Dreeze's four stages, mapping, backup, revival and validation, next to the round size, headcount and availability](img/posts/dreeze-application-revival-en.webp "How Dreeze describes its platform. Graphic: TechSite")

According to the company, the platform works in four stages. First, it automatically maps every resource each application uses and turns that into a recovery plan that updates as the environment changes. Then it backs up everything the application needs, configs and keys included, in an immutable, air-gapped vault. When something breaks, it runs the recovery in the right dependency order. And the part IT managers will like most: you can run the entire plan as a full drill, without touching production, to know in advance that recovery actually works.

"Companies have spent years getting better at backing up data, but getting the data back doesn't mean the business is back," CEO Ziv Kedem said in the company's announcement. He added that with cyber threats rising and AI adding new risks, enterprises need to assume their critical applications will go down.

## Where AI comes in

The company explicitly mentions a scenario that sounded like science fiction not long ago: an AI agent given permission to act in production makes a mistake and breaks an application, no attack required. Dreeze argues that recovering from that is the same problem, because the whole application and its dependencies have to come back. It wasn't the only time the topic came up that week. Bay, another Israeli startup that focuses on controlling what AI agents do inside companies, revealed $50 million in total funding.

## What's available, and when

The AWS version is generally available now. The Microsoft Azure version is in early access, with general availability targeted for early 2027, so that part is still a plan rather than a shipping product. Later this month the company will exhibit at AWS re:Invent, which runs from November 30 to December 3.

## Why it matters

Cloud backup and recovery is a crowded market with big, established players. But Dreeze's founders have something that's hard to buy: they've already built two recovery companies that were sold to giants, and they know these customers from the inside. A $33 million seed with 70 employees and a product already on sale isn't a typical seed either. Whether the platform really brings any app back at the push of a button is something we'll learn from customers. For now, these are capabilities the company describes, not the results of independent testing.

*Conversions at the Bank of Israel rate for Nov 13, 2026: ₪3.199 to the dollar.*
