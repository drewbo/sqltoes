const sqltoes = (input) => {
  const { select, where, groupBy } = input
  // anything wrapped in the select statement becomes the end filter: sum, avg, min, max to start
  const lastFilter = []
  select.forEach((s) => {
    const match = s.match(/sum\(|avg\(|min\(|max\(/g)
    if (match) {
      lastFilter.push(match[0].replace(/\(/, ''))
      lastFilter.push(s.replace(match[0], '').replace(')', ''))
    }
  })

  // anything in where becomes the filter (in order), currently only supports =, should add 'in' soon
  const filters = where.map((filter) => filter.replace(/\(|\)/g, '').split(/= | in |,/))

  // make the object (tiny hack for non grouped objects)
  let aggregate
  if (groupBy.length) {
    aggregate = aggWrap(whereObj(filters, groupByObj(groupBy, lastFilterObj(lastFilter))))
  } else {
    const temp = whereObj(filters, {})
    const topKey = Object.keys(temp)[0]
    aggregate = temp[topKey]
    aggregate.size = 30
    aggregate.filter.terms ? delete aggregate.filter.size : 0
  }
  return aggregate
}

const lastFilterObj = (lf) => {
  const lastFilterObject = {}
  const wrapper = {}
  lastFilterObject[lf[0]] = { 'field': lf[1] }
  wrapper[lf[0] + '_' + lf[1]] = lastFilterObject
  return wrapper
}

const groupByObj = (array, object) => {
  const currentArray = array.slice(0)
  if (!currentArray.length) {
    return object
  } else if (currentArray.length === 1) {
    const obj = {}
    const groupByName = 'group_by_' + currentArray[0]
    obj[groupByName] = { 'terms': { 'field': currentArray[0], 'size': 1000 }, 'aggs': object }
    return obj
  } else {
    const aggs = {}
    const gb = currentArray.shift()
    const groupByName = 'group_by_' + gb
    aggs[groupByName] = { 'terms': { 'field': gb, 'size': 1000 }, 'aggs': groupByObj(currentArray, object) }
    return aggs
  }
}

const whereObj = (array, object) => {
  const currentArray = array.slice(0)
  if (!currentArray.length) {
    return object
  } else if (currentArray.length === 1) {
    const obj = {}
    const term = {}
    const terms = {}
    const w = currentArray[0]
    const tw = w[0].replace(/ /g, '')
    term[tw] = w[1].replace(/\\|'| /g, '')
    if (w.length === 2) {
      const wName = 'where_' + tw + '_' + term[tw]
      obj[wName] = { 'filter': { 'term': term }, 'aggs': object }
    } else {
      const termsArray = w.shift().map((w) => w.replace(/ /g, '')) // purposefully not removing quotes here)
      terms[tw] = termsArray
      const wName = 'where_' + tw + '_multiple'
      obj[wName] = { 'filter': { 'terms': terms }, 'aggs': object }
    }
    return obj
  } else {
    const aggs = {}
    const term = {}
    const terms = {}
    const w = currentArray.shift()
    const tw = w[0].replace(/ /g, '')
    term[tw] = w[1].replace(/\\|'| /g, '')
    if (w.length === 2) {
      const wName = 'where_' + tw + '_' + term[tw]
      aggs[wName] = { 'filter': { 'term': term }, 'aggs': whereObj(currentArray, object) }
    } else {
      const termsArray = w.shift().map((w) => w.replace(/ /g, '')) // purposefully not removing quotes here)
      terms[tw] = termsArray
      const wName = 'where_' + tw + '_multiple'
      aggs[wName] = { 'filter': { 'terms': terms }, 'agg': whereObj(currentArray, object) }
    }
    return aggs
  }
}

const aggWrap = (object) => {
  return {'aggs': object}
}
