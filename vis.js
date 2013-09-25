d3.jsonp = function (url, callback) {
  function rand() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      c = '', i = -1;
    while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
    return c;
  }

  function create(url) {
    var e = url.match(/callback=d3.jsonp.(\w+)/),
      c = e ? e[1] : rand();
    d3.jsonp[c] = function(data) {
      callback(data);
      delete d3.jsonp[c];
      script.remove();
    };
    return 'd3.jsonp.' + c;
  }

  var cb = create(url),
    script = d3.select('head')
    .append('script')
    .attr('type', 'text/javascript')
    .attr('src', url.replace(/(\{|%7B)callback(\}|%7D)/, cb));
};

function threeCircles() {

	// create a root svg
	var svg = d3.select("body")
				.append("svg")
				.attr("width",document.body.clientWidth)
				.attr("height",document.body.clientHeight);
	// bind some data
	var circles = svg.selectAll("circle")
					 .data([
					 	{size: 5},
					 	{size: 10},
					 	{size: 15}
					 ]);
	// draw some circles
	circles.enter()
		   .append("circle")
		   .attr("r",function(d){
		   	 return d.size;
		   })
		   .attr("cx",function() {
		   	 return 50 + Math.random() * (document.body.clientWidth - 50)
		   })
		   .attr("cy",function() {
		   	 return 50 + Math.random() * (document.body.clientHeight - 50)
		   })
}

var redditSvg;
function redditVis() {
	setInterval(function() {
		d3.jsonp("http://www.reddit.com/.json?jsonp=runVis&cb=" + Math.random());
	},2000);
	d3.jsonp("http://www.reddit.com/.json?jsonp=runVis&cb=" + Math.random());
	redditSvg = d3.select("body")
				.append("svg")
				.attr("width",document.body.clientWidth - 50)
				.attr("height",document.body.clientHeight - 50);
}

function runVis(data) {
	var formatted = formatRedditData(data);

	var stories = redditSvg
	   .selectAll(".story")
	   .data(formatted,function(d) {
	   	 return d.id;
	   });

	stories.forEach(function(d) {  d.score = Math.E * d.score })

	var radiusScale = d3.scale.linear()
		.domain(d3.extent(formatted,function(d) {
			return d.score;
		}))
		.range([10,100]);

	var row = Math.floor(document.body.clientWidth / 200);

	// ENTER context
	stories.enter()
		   .append("g")
		   .classed("story",true)
		   .append("circle")
		   .attr("cx",function(d,i) {
		   		return (i % row) * 200;
		   })
		   .attr("cy",function(d,i) {
		   		return Math.floor(i / row) * 200;
		   })
		   .attr("r",0)
		   ;

	// UPDATE + ENTER context
    stories
    	   .select("circle")
    	   .transition(500)
    	   .attr("r",function(d) {
		   		return radiusScale(d.score);
		   });

    // EXIT content
	stories.exit()
		   .transition(2000)
		   .attr("r",0);	
}

function formatRedditData(data) {
	return data.data.children.map(function(story) {
		return story.data;
	});
}

redditVis();