---
title: Analytics
description: Analytics notice for Opendrive
---

By default Opendrive sends a heartbeat to our analytics server once every 24 hours. Seeing how many active Opendrive instances are out there genuinely motivates our team to keep developing and maintaining the project. The instance count is also displayed on the [Opendrive website](https://pocket-id.org).

## What We Collect

Only minimal, non-identifiable data is collected:

- **Instance ID**: A random UUID (not linked to any personal information)
- **Version**: Your Opendrive version
- **Heartbeat timestamps**: When your instance was first/last seen

We do not log or store IP addresses, user agents, or any other potentially identifiable information. The source code of the [analytics server](https://github.com/pocket-id/analytics) is open source.

## Opting Out

Analytics can be disabled at any time by setting the environment variable `ANALYTICS_DISABLED` to `true`. When disabled, no data is sent to our servers.

## Public Statistics

Aggregated instance counts are displayed on our homepage. The API is publicly accessible, the docs can be found in the [analytics server repository](https://github.com/pocket-id/analytics).
