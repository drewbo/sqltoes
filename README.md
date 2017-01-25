sqltoes (sql to ES)
=========

#### Writing elasticsearch commands is hard, writing SQL queries is...less hard

Motivation: Elasticsearch commands are confusing to write at a certain point. See [this](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/search-aggregations-metrics-sum-aggregation.html) as an example and see the [reference](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/index.html) for help.

### Installation

```bash
npm install sqltoes
```


### Use

    sqlToES({select: ['sum(value)'], where: ['commodity = rice'], groupBy: ['description','year']})

### How it works (and what works so far)

Looks for all three of the following: `SELECT, WHERE, GROUP BY` (in that order and requires them all)

- Anything in the `SELECT` clause is ignored unless it is wrapped in `sum, min, max, or avg` all of which become a [final aggregation](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/search-aggregations-metrics-sum-aggregation.html)
- Anything in the `FROM` clause gets added as the html endpoint
- The `WHERE` clause supports two types of queries:
  - `[field] = [value]` will be treated as a [term filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-term-filter.html).
  - `[field] in ([value1],value[2])` will be treated as a [terms filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-terms-filter.html).
- Anything in the `GROUP BY`clause is treated like the second example shown [here](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/_executing_aggregations.html).
