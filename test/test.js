var test = require('tape')
var sqltoes = require('../')

test('first test', function (t) {
  var query = sqltoes({select: ['sum(value)'], where: ['commodity = rice'], groupBy: ['description', 'year']})
  t.deepEqual(query, {
    aggs: {
      where_commodity_rice: {
        aggs: {
          group_by_description: {
            aggs: {
              group_by_year: {
                terms: {
                  field: 'year',
                  size: 1000
                },
                aggs: {
                  sum_value: {
                    sum: {
                      field: 'value'
                    }
                  }
                }
              }
            },
            terms: {
              field: 'description',
              size: 1000
            }
          }
        },
        filter: {
          term: {
            commodity: 'rice'
          }
        }
      }
    }
  })
  t.end()
})
