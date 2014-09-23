sql-to-es
=========

#### Writing elasticsearch commands is hard, writing SQL queries is...less hard

Motivation: Elasticsearch commands are confusing to write at a certain point. See [this](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/search-aggregations-metrics-sum-aggregation.html) as an example and see the [reference](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/index.html) for help.

### Use

Currently user-unfriendly

- add your input
- call `main` on your input
- get two outputs
  - the local database you should POST to
  - a JSON object representing your query (which has been `stringified` so that it POSTs properly)

In node:

    > var stqltoes = require('./main.js')
    > your_input = "SELECT sum(value), year, description \n FROM database \n WHERE commodity = 'rice' AND country = 'AFG' \n GROUP BY year, description"
    > stqltoes.main(your_input)
    0.0.0.0:9200/database/_search?
    '{"aggs":{"where_commodity_rice":{"filter":{"term":{"commodity":"rice"}},"aggs":{"where_country_AFG":{"filter":{"term":{"country":"AFG"}},"aggs":{"group_by_year":{"terms":{"field":"year"},"aggs":{"group_by_description":{"terms":{"field":"description"},"aggs":{"sum_value":{"sum":{"field":"value"}}}}}}}}}}}}'

### How it works (and what works so far)

Looks for all four of the following: `SELECT, FROM, WHERE, GROUP BY` (in that order and requires them all)

- Anything in the `SELECT` clause is ignored unless it is wrapped in `sum, min, max, or avg` all of which become a [final aggregation](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/search-aggregations-metrics-sum-aggregation.html)
- Anything in the `FROM` clause gets added as the html endpoint
- The `WHERE` clause supports two types of queries:
  - `[field] = [value]` will be treated as a [term filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-term-filter.html)
  - `[field] in ([value1],value[2])` will be treated as an [and filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-and-filter.html#query-dsl-and-filter) of term filters. I realized while typing this documentation up that it could very easily be implemented as a [terms filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-terms-filter.html) which I will remedy in the future.
- Anything in the `GROUP BY`clause is treated like the second example [here](http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/_executing_aggregations.html)
