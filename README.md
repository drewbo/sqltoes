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

    > m = require('./main.js')
    > your_input = "SELECT sum(value), year, description \n FROM database \n WHERE commodity = 'rice' AND country = 'AFG' \n GROUP BY year, description"
    > m.main(your_input)
    0.0.0.0:9200/database/_search?
    '{"aggs":{"where_commodity_jrice":{"filter":{"term":{"commodity":"jrice"}},"aggs":{"group_by_year":{"terms":{"field":"year"},"aggs":{"group_by_description":{"terms":{"field":"description"},"aggs":{"sum":{"field":"value"}}}}}}}}}'
