var sqltoes = function (input) {
  var select = input.select
  var where = input.where
  var groupBy = input.groupBy

  // anything wrapped in the select statement becomes the end filter: sum, avg, min, max to start
  var lastFilter = []
  for (var i = 0; i < select.length; i++) {
    var m = select[i].match(/sum\(|avg\(|min\(|max\(/g)
    if (m) {
      lastFilter.push(m[0].replace(/\(/, ''))
      lastFilter.push(select[i].replace(m[0], '').replace(')', ''))
    }
  }

  // anything in where becomes the filter (in order), currently only supports =, should add 'in' soon
  var filters = []
  for (i = 0; i < where.length; i++) {
    filters.push(where[i].replace(/\(|\)/g, '').split(/= |in|,/))
  }

  // make the object (tiny hack for non grouped objects)
  if (groupBy.length) {
    var a = aggWrap(whereObj(filters, groupByObj(groupBy, lastFilterObj(lastFilter))))
  } else {
    var temp = whereObj(filters, {})
    var topKey = Object.keys(temp)[0]
    a = temp[topKey]
    a['size'] = 30
    a.filter.terms ? delete a.filter.size : 0
  }
  return a
}

var lastFilterObj = function (lf) {
  var lastFilterObject = {}
  var wrapper = {}
  lastFilterObject[lf[0]] = { 'field': lf[1] }
  wrapper[lf[0] + '_' + lf[1]] = lastFilterObject
  return wrapper
}

var groupByObj = function (array, object) {
  var currentArray = array.slice(0)
  if (currentArray.length === 0) {
    return object
  } else if (currentArray.length === 1) {
    var obj = {}
    var groupByName = 'group_by_' + currentArray[0]
    obj[groupByName] = { 'terms': { 'field': currentArray[0], 'size': 1000 }, 'aggs': object }
    return obj
  } else {
    var aggs = {}
    var gb = currentArray.shift()
    groupByName = 'group_by_' + gb
    aggs[groupByName] = { 'terms': { 'field': gb, 'size': 1000 }, 'aggs': groupByObj(currentArray, object) }
    return aggs
  }
}

var whereObj = function (array, object) {
  var currentArray = array.slice(0)
  if (currentArray.length === 0) {
    return object
  } else if (currentArray.length === 1) {
    var obj = {}
    var term = {}
    var terms = {}
    var w = currentArray[0]
    var tw = w[0].replace(/ /g, '')
    term[tw] = w[1].replace(/\\|'| /g, '')
    if (w.length === 2) {
      var wName = 'where_' + tw + '_' + term[tw]
      obj[wName] = { 'filter': { 'term': term }, 'aggs': object }
    } else {
      var termsArray = []
      for (var t = 0; t < w.length - 1; t++) {
        termsArray.push(w[t + 1].replace(/ /g, '')) // purposefully not removing quotes here
      }
      terms[tw] = termsArray
      wName = 'where_' + tw + '_multiple'
      obj[wName] = { 'filter': { 'terms': terms }, 'aggs': object }
    }
    return obj
  } else {
    var aggs = {}
    term = {}
    terms = {}
    w = currentArray.shift()
    tw = w[0].replace(/ /g, '')
    term[tw] = w[1].replace(/\\|'| /g, '')
    if (w.length === 2) {
      wName = 'where_' + tw + '_' + term[tw]
      aggs[wName] = { 'filter': { 'term': term }, 'aggs': whereObj(currentArray, object) }
    } else {
      termsArray = []
      for (t = 0; t < w.length - 1; t++) {
        termsArray.push(w[t + 1].replace(/ /g, '')) // purposefully not removing quotes here
      };
      terms[tw] = termsArray
      wName = 'where_' + tw + '_multiple'
      aggs[wName] = { 'filter': { 'terms': terms }, 'agg': whereObj(currentArray, object) }
    }
    return aggs
  }
}

var aggWrap = function (object) {
  return {
    'aggs': object
  }
}

module.exports = sqltoes
