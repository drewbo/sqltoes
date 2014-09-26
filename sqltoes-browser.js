//this is a modified version of this script, accepting objects instead of strings and additional size parameters

var sqlToES = function(input) {

    var a;
    //split = input.split(/SELECT|FROM|WHERE|GROUP BY/)

    i_select = input.select
    i_from = input.from
    i_where = input.where
    i_groupby = input.groupby
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

    // make the object (tiny hack for non_grouped objects)
    if (i_groupby.length) {
      a = agg_wrap(where_obj(filters,groupby_obj(i_groupby,last_filter_obj())))
    }
    else {
      var temp = where_obj(filters,{}),
      topKey = Object.keys(temp)[0];
      a = temp[topKey]
      a['size'] = 30
      a.filter.terms ? delete a.filter.size : 0;
    }
    //console.log(endpoint)
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
    if (dis_array.length === 0) {
        return object;
    }
    else if (dis_array.length === 1) {
        obj = {};
        gb_name = 'group_by_' + dis_array[0];
        obj[gb_name] = { "terms" : { "field" : dis_array[0], "size" : 1000}, "aggs" : object };
        return obj;
      }
    else {
        var aggs = {}; // important to use var here to scope properly
        gb = dis_array.shift();
        gb_name = 'group_by_' + gb;
        aggs[gb_name] = { "terms" : { "field" : gb, "size" : 1000}, "aggs" : groupby_obj(dis_array,object) };
        return aggs;
      }
}

var where_obj = function(array,object) {
    var dis_array = array.slice(0);
    if (dis_array.length === 0) {
        return object;
    }
    else if (dis_array.length === 1) {
        obj = {}, term = {}, terms = {};
        w = dis_array[0]
        tw = w[0].replace(/ /g,'')
        term[tw] = w[1].replace(/\\|\'| /g,'')
        if (w.length === 2){
          w_name = 'where_' + tw + '_' + term[tw];
          obj[w_name] = { "filter" : { "term" : term} , "aggs" : object };
        }
        else {
          termsArray = []
          for (var t = 0; t < w.length - 1; t++){
            termsArray.push(w[t+1].replace(/ /g,'')) // purposefully not removing quotes here
          }
          terms[tw] = termsArray;
          w_name = 'where_' + tw + '_multiple';
          obj[w_name] = { "filter" : { "terms" : terms}, "aggs" : object };
        }
        return obj;
      }
    else {
        var aggs = {}, term = {}, terms = {}; // important to use var here to scope properly
        w = dis_array.shift();
        tw = w[0].replace(/ /g,'')
        term[tw] = w[1].replace(/\\|\'| /g,'');
        if (w.length === 2){
          w_name = 'where_' + tw + '_' + term[tw];
          aggs[w_name] = { "filter" : { "term" : term}, "aggs" : where_obj(dis_array,object) };
        }
        else {
          termsArray = [];
          for (var t = 0; t < w.length - 1; t++){
            termsArray.push(w[t+1].replace(/ /g,'')) // purposefully not removing quotes here
          };
          terms[tw] = termsArray;
          w_name = 'where_' + tw + '_multiple';
          aggs[w_name] = { "filter" : { "terms" : terms}, "aggs" : where_obj(dis_array,object) };
        }
        return aggs;
      }
}

var agg_wrap = function(object) {
  wrap = {};
  wrap['aggs'] = object;
  return wrap;
}
