---
title: "Israel's Brava Security raises $15M Seed for AI attack-telemetry simulation"
date: 2026-11-06
slug: brava-security-15-million
category: tech-news
excerpt: "The cybersecurity startup from Unit 8200 and Microsoft alumni is out of stealth with a $15 million Seed led by Pitango and F2. Its platform generates the traces an attack would leave, without running the attack, then checks whether existing defenses actually catch them."
image: img/posts/brava-security-founders.webp
image_alt: "Brava Security founders Idan Basre and Itay Gabbay sitting in an office on orange chairs in black Brava T-shirts"
image_credit: "Image: Brava Security / Roei Shur"
image_credit_url: "https://www.brava.security/news/announcing-brava"
source_links:
  - "https://www.calcalistech.com/ctechnews/article/syl22sopze"
  - "https://www.brava.security/news/announcing-brava"
  - "https://www.axios.com/pro/enterprise-software-deals/2026/11/04/brava-security-seed-pitango"
  - "https://www.ynetnews.com/business/article/by700exq6zl"
---

Another Israeli cyber company is coming out of stealth with a sizable check. Brava Security has raised $15 million (about ₪47.5 million) in a Seed round led by Pitango and F2 Venture Capital, with private investors including executives from Anthropic, Microsoft and Check Point. The announcement landed on November 4, 2026.

The company was founded in 2024 by Idan Basre (CEO) and Itay Gabbay (CTO). Basre is a Talpiot graduate who spent a decade in Unit 8200 as a threat researcher, then led product management for Microsoft Defender. Gabbay spent seven years in the IDF building AI systems, including a joint research effort with DARPA.

![Brava funding facts: $15 million, Pitango and F2, about 20 employees and an Israeli R&D center](img/posts/brava-security-seed-facts-en.webp "The numbers behind the stealth exit. Graphic: TechSite")

## What they're actually building

The idea is simpler than it sounds. SOC teams increasingly lean on AI agents to investigate incidents and make decisions, but those agents only see what lands in the logs. If a detection rule is broken, a telemetry pipeline is stuck, or a given attack never leaves traces in your stack, the AI won't know it missed anything.

Brava runs multiple AI agents that synthesize the telemetry an attack would leave in that specific organization's environment, without executing the attack. It then checks whether existing defenses detect that evidence. When they don't, the platform can rewrite detection rules in your SIEM's own query language, fix collection and forwarding gaps, and verify the fix.

Customers, the company says, include Fortune 100 firms in retail, energy and hospitality, plus Cushman & Wakefield and Canada's WELL Health. First findings are meant to arrive within 10 to 15 minutes of onboarding, with integrations for Splunk, Google SecOps, CrowdStrike and more than 70 other sources and destinations.

## Why it matters now

Basre put it bluntly in the company post: everyone is racing to put AI in charge of the SOC, but you can't automate a decision on evidence nobody has proved the system can see. Brava is aiming at the layer before automation: making sure the infrastructure actually observes the threats it's supposed to catch.

The company employs about 20 people, including AI and cyber researchers, with an R&D center in Israel and a growing commercial team in the US. The new capital goes into product work and North American expansion, with financial services and government on the roadmap.

For the local ecosystem it's another sign that investors still write cyber checks for Israeli founders even when global funding is selective. For enterprises that already poured budget into SIEM and EDR, the pitch isn't rip-and-replace. It's finally proving whether what you bought can see what you thought it could.

*Conversions use the Bank of Israel representative rate for 5 Nov 2026: ₪3.167 per dollar.*
