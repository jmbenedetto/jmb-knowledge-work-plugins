---
name: anthropic-data-analyze
description: "Answer data questions -- from quick lookups to full analyses. Use when looking up a single metric, investigating what's driving a trend or drop, comparing segments over time, or preparing a formal data report for stakeholders."
license: Apache-2.0
---

> Modified for Pi from Anthropic's data/skills/analyze/SKILL.md. See [modification notice](../../NOTICE).

# /skill:anthropic-data-analyze - Answer Data Questions

## Pi execution

Use `read` to inspect inputs and references, `bash` to discover files and run local
Python or SQL, `write` for new scripts and outputs, and `edit` for precise changes.
Resolve bundled paths from the directory containing this file, not the shell's
working directory. Derive the absolute path from Pi's reported skill location;
quote every shell path, including paths with spaces. Keep generated analysis files
in the user's chosen working directory, outside the installed package.

A warehouse integration is unavailable unless separately configured, verified and
authorized in this session. When not configured, use local files, pasted results,
or SQL for manual execution. Read [connector guidance](../../CONNECTORS.md) before
using optional external tools or installing missing local dependencies.


> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../../CONNECTORS.md).

Answer a data question, from a quick lookup to a full analysis to a formal report.

## Usage

```
/skill:anthropic-data-analyze <natural language question>
```

## Workflow

### 1. Understand the Question

Parse the user's question and determine:

- **Complexity level**:
  - **Quick answer**: Single metric, simple filter, factual lookup (e.g., "How many users signed up last week?")
  - **Full analysis**: Multi-dimensional exploration, trend analysis, comparison (e.g., "What's driving the drop in conversion rate?")
  - **Formal report**: Comprehensive investigation with methodology, caveats, and recommendations (e.g., "Prepare a quarterly business review of our subscription metrics")
- **Data requirements**: Which tables, metrics, dimensions, and time ranges are needed
- **Output format**: Number, table, chart, narrative, or combination

### 2. Gather Data

**If a data warehouse MCP server is connected:**

1. Explore the schema to find relevant tables and columns
2. Write SQL query(ies) to extract the needed data
3. Execute the query and retrieve results
4. If the query fails, debug and retry (check column names, table references, syntax for the specific dialect)
5. If results look unexpected, run sanity checks before proceeding

**If no data warehouse is connected:**

1. Ask the user to provide data in one of these ways:
   - Paste query results directly
   - Upload a CSV or Excel file
   - Describe the schema so you can write queries for them to run
2. If writing queries for manual execution, use the [anthropic-data-sql-queries reference](references/anthropic-data-sql-queries/REFERENCE.md) for dialect-specific best practices
3. Once data is provided, proceed with analysis

### 3. Analyze

- Calculate relevant metrics, aggregations, and comparisons
- Identify patterns, trends, outliers, and anomalies
- Compare across dimensions (time periods, segments, categories)
- For complex analyses, break the problem into sub-questions and address each

### 4. Validate Before Presenting

Before sharing results, run through validation checks:

- **Row count sanity**: Does the number of records make sense?
- **Null check**: Are there unexpected nulls that could skew results?
- **Magnitude check**: Are the numbers in a reasonable range?
- **Trend continuity**: Do time series have unexpected gaps?
- **Aggregation logic**: Do subtotals sum to totals correctly?

If any check raises concerns, investigate and note caveats.

### 5. Present Findings

**For quick answers:**
- State the answer directly with relevant context
- Include the query used (collapsed or in a code block) for reproducibility

**For full analyses:**
- Lead with the key finding or insight
- Support with data tables and/or visualizations
- Note methodology and any caveats
- Suggest follow-up questions

**For formal reports:**
- Executive summary with key takeaways
- Methodology section explaining approach and data sources
- Detailed findings with supporting evidence
- Caveats, limitations, and data quality notes
- Recommendations and suggested next steps

### 6. Visualize Where Helpful

When a chart would communicate results more effectively than a table:

- Use the [anthropic-data-data-visualization reference](references/anthropic-data-data-visualization/REFERENCE.md) to select the right chart type
- Generate a Python visualization or build it into an HTML dashboard
- Follow visualization best practices for clarity and accuracy

## Examples

**Quick answer:**
```
/skill:anthropic-data-analyze How many new users signed up in December?
```

**Full analysis:**
```
/skill:anthropic-data-analyze What's causing the increase in support ticket volume over the past 3 months? Break down by category and priority.
```

**Formal report:**
```
/skill:anthropic-data-analyze Prepare a data quality assessment of our customer table -- completeness, consistency, and any issues we should address.
```

## Tips

- Be specific about time ranges, segments, or metrics when possible
- If you know the table names, mention them to speed up the process
- For complex questions, Pi may break them into multiple queries
- Results are always validated before presentation -- if something looks off, Pi will flag it

## Bundled supporting references

Read the relevant reference when the question needs its detail.

- [anthropic-data-data-context-extractor](references/anthropic-data-data-context-extractor/REFERENCE.md).
- [anthropic-data-data-visualization](references/anthropic-data-data-visualization/REFERENCE.md).
- [anthropic-data-sql-queries](references/anthropic-data-sql-queries/REFERENCE.md).
- [anthropic-data-statistical-analysis](references/anthropic-data-statistical-analysis/REFERENCE.md).
