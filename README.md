sqltoes (sql to ES)
=========

#### Writing elasticsearch commands is hard, writing SQL queries is...less hard

Motivation: Elasticsearch commands are [confusing to write](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html) at a certain point. See the Elasticsearch [reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) for more help.

### Installation

```bash
npm install sqltoes
```


### Use

    sqlToES({select: ['sum(value)'], where: ['commodity = rice'], groupBy: ['description','year']})

### How it works (and what works so far)

Looks for three properties: `select`, `where`, and `groupBy` (currently requires them all)

- Anything in the `select` clause is ignored unless it is wrapped in `sum, min, max, or avg` all of which become a [final aggregation](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/search-aggregations-metrics-sum-aggregation.html)
- The `where` clause supports two types of queries:
  - `[field] = [value]` will be treated as a [term filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-term-filter.html).
  - `[field] in ([value1],value[2])` will be treated as a [terms filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-terms-filter.html).
- Anything in the `groupBy` clause is treated like the second example shown [here](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/_executing_aggregations.html).

### Similar works
- [`sql-where-parser`](https://github.com/shaunpersad/sql-where-parser)
- [`sql2es`](https://github.com/feifeiiiiiiiiiii/sql2es)
- [`sql-es`](https://github.com/ryankirkman/sql-es)
