# StockFlow S Plus — Analytics Architecture

## Overview

The Analytics Layer was added to StockFlow S Plus to transform the project from an operational inventory and sales management system into a business intelligence-oriented platform.

This layer provides consolidated business metrics, operational indicators, financial summaries, stock insights, sales analytics, and a structured Power BI dataset endpoint.

The goal is to support decision-making through clean, centralized and authenticated analytics endpoints.

---

## Purpose

The Analytics Layer is responsible for:

- Consolidating business KPIs.
- Aggregating sales, stock and finance data.
- Preparing operational data for Power BI consumption.
- Providing filtered analytics by date range.
- Supporting executive dashboards and portfolio storytelling.
- Separating analytical concerns from operational CRUD logic.

---

## Main Endpoints

All analytics endpoints are protected by authentication and require the `reports:read` permission.

Base path:

```txt
/api/analytics