
the_input = "SELECT sum(value), year, description \n FROM database \n WHERE commodity = 'jrice' \n GROUP BY year, description"

var main = function(input) {

    split = input.split(/SELECT|FROM|WHERE|GROUP BY/)

    i_select = split[1].replace(/\n| /g,'').split(',')
    i_from = split[2].replace(/\n| /g,'').split(',')
    i_where = split[3].replace(/\n/g,'').split('AND ')
    i_groupby = split[4].replace(/\n| /g,'').split(',')

    // database -> endpoint

    endpoint = '0.0.0.0:9200/' + i_from + '/_search?'

    // anything wrapped in the select statement becomes the end filter: sum, avg, min, max to start

    last_filter = []
    for (var i = 0; i < i_select.length; i++) {
        m = i_select[i].match(/sum\(|avg\(|min\(|max\(/g);
        if (m) {
            last_filter.push(m[0].replace(/\(/,''))
            last_filter.push(i_select[i].replace(m[0],'').replace(')',''))
        }
    }

    // anything in where becomes the filter (in order), currently only supports =, should add 'in' soon
    filters = []
    for (var i = 0; i < i_where.length; i++) {
        filters.push(i_where[i].replace(/\(|\)/g,'').split(/= |in|,/))
    }

    // make the object

    a = agg_wrap(where_obj(filters,groupby_obj(i_groupby,last_filter_obj())))

    console.log(endpoint)
    return JSON.stringify(a)
}


var last_filter_obj = function() {
    var last_filter_object = {}, wrapper = {};
    last_filter_object[last_filter[0]] = { "field" : last_filter[1] };
    wrapper[last_filter[0]+'_'+last_filter[1]] = last_filter_object;
    return wrapper;
}

var groupby_obj = function(array,object) {
    var dis_array = array.slice(0);
    if (dis_array.length === 1) {
        obj = {};
        gb_name = 'group_by_' + dis_array[0];
        obj[gb_name] = { "terms" : { "field" : dis_array[0]}, "aggs" : object };
        return obj;
      }
    else {
        var aggs = {}; // important to use var here to scope properly
        gb = dis_array.shift();
        gb_name = 'group_by_' + gb;
        aggs[gb_name] = { "terms" : { "field" : gb}, "aggs" : groupby_obj(dis_array,object) };
        return aggs;
      }
}

var where_obj = function(array,object) {
    var dis_array = array.slice(0);
    if (dis_array.length === 1) {
        obj = {};
        w = dis_array[0]
        tw = w[0].replace(/ /g,'')
        if (w.length === 2){
          var term = {};
          term[tw] = w[1].replace(/\\|\'| /g,'')
          w_name = 'where_' + tw + '_' + term[tw];
          obj[w_name] = { "filter" : { "term" : term}, "aggs" : object };
        }
        else {
          terms = []
          for (var t = 0; t < w.length - 1; t++){
            var term = {};
            term[tw] = w[t+1].replace(/\\|\'| /g,'');
            terms.push({ "term" : term })
          }
          w_name = 'where_' + tw + '_multiple';
          obj[w_name] = { "filter" : { "and" : terms}, "aggs" : object };
        }
        return obj;
      }
    else {
        var aggs = {}; // important to use var here to scope properly
        w = dis_array.shift();
        tw = w[0].replace(/ /g,'')
        if (w.length === 2){
          var term = {};
          term[tw] = w[1].replace(/\\|\'| /g,'');
          w_name = 'where_' + tw + '_' + term[tw];
          aggs[w_name] = { "filter" : { "term" : term}, "aggs" : where_obj(dis_array,object) };
        }
        else {
          terms = [];
          for (var t = 0; t < w.length - 1; t++){
            var term = {};
            term[tw] = w[t+1].replace(/\\|\'| /g,'');
            terms.push({ "term" : term })
          };
          w_name = 'where_' + tw + '_multiple';
          aggs[w_name] = { "filter" : { "and" : terms}, "aggs" : where_obj(dis_array,object) };
        }
        return aggs;
      }
}

var agg_wrap = function(object) {
  wrap = {};
  wrap['aggs'] = object;
  return wrap;
}

module.exports.main = main;
module.exports.last_filter_obj = last_filter_obj;
module.exports.groupby_obj = groupby_obj;
module.exports.where_obj = where_obj;
module.exports.agg_wrap = agg_wrap;
