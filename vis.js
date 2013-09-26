var redditSvg;
var previousData;

var RADIUS = 100;
var MIN_RADIUS = 10;
var PADDING = 50;
var POLL_SPEED = 2000;

function redditVis() {
  // setup a poll requesting data, and make an immediate request
  setInterval(requestData,POLL_SPEED);
  requestData();

  // initial setup only needs to happen once 
  // - we don't want to append multiple root SVG elements
  redditSvg = d3.select("body")
        .append("svg")
        .attr("width",document.body.clientWidth - 50)
        .attr("height",(RADIUS + PADDING) * 12);
}

function requestData() {
  // our jsonp url, with a cache-busting query parameter
  d3.jsonp("http://www.reddit.com/.json?jsonp=runVis&noCache=" + Math.random());
}

function runVis(data) {

  // d3 never does anything automagical to your data
  // so we'll need to get data into the right format, with the
  // previous values attached
  var formatted = formatRedditData(data,previousData);

  // setup our radius scale - this maps from the min & max of scores
  // to min and max radius we've set above
  var radiusScale = d3.scale.linear()
    .domain(d3.extent(formatted,function(d) {
      return d.score;
    }))
    .range([MIN_RADIUS,RADIUS]);

  // select our stories, pulling in previous ones to update
  // by selecting on the stories' class name
  var stories = redditSvg
     .selectAll(".story")
     // the return value of data() is the update context - so the 'stories' var is
     // how we refence the update context from now on
     .data(formatted,function(d) {
       // use a key function to ensure elements are always bound to the same 
       // story (especially important when data enters/exits)
       return d.id;
     });

  // calculate how many circles we'll get on a row
  var row = Math.floor((document.body.clientWidth - PADDING) / (RADIUS * 2));

  // ENTER context
  // here we create a group element to hold the past and previous score circles
  var storiesEntering = stories.enter()
       .append("g")
       .classed("story",true)

  // to add multiple children in d3, capture the context of the parent in a varible
  // and reuse it to add as many children as is required
  storiesEntering
       .append("circle")
       .classed("past",true);

  storiesEntering
       .append("circle")
       .classed("present",true);

  // UPDATE + ENTER context
  // elements added via enter() will then be available on the update context, so
  // we can set attributes once, for entering and updating elements, here
  stories
     .attr("transform",function(d,i) {
        var x = 100 + (i % row) * (RADIUS * 2);
        var y = 100 + Math.floor(i / row) * (RADIUS * 2);
        return "translate(" + x + "," + y + ")";
     });

  stories
     // we select inside our top-level story groups to get a specific child
     .select(".present")
     // when we hover over a story, show the title of the story as an overlay
     .on("mouseover",showTitle)
     // classed takes either a boolean, or a function that returns a boolean,
     // which decides whether d3 should ensure the class is or isn't present
     .classed("up",function(d) {
       return d.diff > 0
     })
     .classed("down",function(d) {
       return d.diff < 0
     })
     // setting a transition will make all future attribute changes
     // happen over a period - the duration is set in milliseconds
     .transition(500)
     .attr("r",function(d) {
        return radiusScale(d.score);
     });

  stories
     .select(".past")
     .transition(500)
     .attr("r",function(d) {
        if(!d.previous || d.diff === 0) return 0;
        return radiusScale(d.previous.score);
     });

  // EXIT content
  stories.exit()
       .select(".present, .past")
       .transition(500)
       .attr("r",0)
       .remove();
}

function showTitle(d) {
  // this is a callback on the event listener of a d3 selection, so it'll
  // take the arguments you'd expect: datum and index
  d3.select("#title")
    .classed("on",true)
    .text(d.title);
}

function formatRedditData(data) {
  // dig through reddit's data structure to get a flat list of stories
  var formatted = data.data.children.map(function(story) {
    return story.data;
  });
  // make a map of storyId -> previousData
  var previousDataById = (previousData || []).reduce(function(all,d) {
    all[d.id] = d;
    return all;
  },{});
  // for each present story, see if it has a previous value,
  // attach it and calculate the diff
  formatted.forEach(function(d) {
    d.previous = previousDataById[d.id];
    d.diff = 0;
    if(d.previous) {
      d.diff = d.score - d.previous.score;
    }
  });
  // our new data will be the previousData next time
  previousData = formatted;
  return formatted;
}

redditVis();
