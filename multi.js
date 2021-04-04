
///////////////////// MULTI TEST PARAMS /////////////////////////
var x, y, z;
var timer ;
let min_x = 2;
let min_y = 2;
let max_x = 10;
let max_y = 10;
let max_t = 15*4; // max time for answering
let zoom = 10;     
var start_of_session = Date.now();

/////////////////////// MULTI STATS /////////////////////////////////
let show_multi_stats = (data, selector, stat_fun, unit) => {

    // set the dimensions and margins of the graph
    let margin = {top: 20, right: 25, bottom: 30, left: 40},
	width = (max_x - min_x)*zoom,
	height = (max_x - min_x)*zoom;
    
    // append the svg object to the body of the page
    d3.select(selector)
	.selectAll("*")
	.remove();

    var svg = d3.select(selector)
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
    
    // define x axis
    let x_scale = d3.scaleBand()
	.range([0,width])
	.domain(Array.from({length: max_x-min_x}, (c, i) => i + min_x))
	.padding(0.05);
    
    svg.append("g")
	.style("font-size", 12)
	.attr("transform", "translate(0," + height + ")")
	.call(d3.axisBottom(x_scale).tickSize(0))
	.select(".domain").remove();
    
    // define y axis
    let y_scale = d3.scaleBand()
	.range([ height, 0 ])
	.domain(Array.from({length:max_y - min_y}, (c,i) => i + min_y))
	.padding(0.05);
    
    svg.append("g")
    	.style("font-size", 12)
    	.call(d3.axisLeft(y_scale).tickSize(0))
    	.select(".domain").remove();

    d3.select(selector)
	.append("div")
	.html(`${unit} <BR>`);
    
    // define color scale for good / bad - yellow at 0.75
    let color_scale = d3
	.scaleLinear()
	.domain([0,0.75,1])
	.range(["red","yellow", "green"]);
    
    // create a tooltip
    var div = d3.select(selector)
	.append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);
    
    let mouseover = (event, d) => {
	div.transition()
            .duration(200)
            .style("opacity", .9);
	div.html(`${(stat_fun(d.data)*100).toFixed(1)}%`)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    };
    
    let mouseout = (event, d) => {
	div.transition()
            .duration(500)
            .style("opacity", 0);
    };
    
    svg.selectAll()
	.data(data)
	.enter()
	.append("rect")
	.attr("x", d => {return x_scale(d.x); })
	.attr("y", d => {return y_scale(d.y); })
	.attr("rx", 4)
	.attr("ry", 4)
	.attr("width", x_scale.bandwidth() )
	.attr("height", y_scale.bandwidth() )
	.style("fill", d =>  { return color_scale(stat_fun(d.data));})
	.style("stroke-width", 4)
	.style("stroke", "none")
	.style("opacity", 0.8)
	.on("mouseover", mouseover)
	.on("mouseout", mouseout);
};

//////////////////// MULTI TEST /////////////////////////

let reset = () => {
    document.getElementById('multi_challenge').innerHTML =' ' ;
    document.getElementById('multi_guess').value = undefined;
    x = undefined;
    y = undefined;
    z = undefined;
};

let draw = () => {
    x = Math.floor(Math.random() * (max_x - min_x) + min_x);
    y = Math.floor(Math.random() * (max_y - min_y) + min_y);
    z = undefined;
    timer = Date.now();
    document.getElementById("multi_challenge").innerHTML = `Calcule ${x} x ${y}`;
    };

let new_session = () => {
    start_of_session = Date.now();
    draw();
};

let verify = () => {
    var v, t, dt;
    let data = JSON.parse(localStorage.getItem('multi')) || [];
    z = parseInt(document.getElementById("multi_guess").value, 10);
    v = z == (x * y);
    t = Date.now();
    dt = t - timer;
    data.push({x,y,z,t,dt,v});
    localStorage.setItem('multi', JSON.stringify(data));
    document.getElementById("multi_guess").value = undefined;
};

document
    .getElementById("multi_guess")
    .addEventListener("keyup", ({key}) => {if (key === "Enter") {
	verify();
	let raw_data = JSON.parse(localStorage.getItem("multi"));
	let all_data = [];
	let session_data = [] ;
	let current_data = raw_data.filter( d => d.t >  start_of_session);
	let success_fun = d => {return d.reduce((a,c) => {return a + c.v;}, 0) / d.length;};
	let time_fun = d => {return 1 - d.reduce((a,c) => {return a + Math.min(c.dt, max_t*1000);}, 0) / (d.length * max_t * 1000);};

	raw_data.forEach( d => {
	    let idx = all_data.findIndex(c => c.x == d.x && c.y == d.y);
	    if ( idx == -1) {all_data.push({x:d.x, y:d.y, data:[d]});}
	    else {all_data[idx].data.push(d);}});
	raw_data.filter( d => d.t >  start_of_session).forEach( d => {
	    let idx = session_data.findIndex(c => c.x == d.x && c.y == d.y);
	    if ( idx == -1) {session_data.push({x:d.x, y:d.y, data:[d]});}
	    else {session_data[idx].data.push(d);}});

	document.getElementById("multi_result").innerHTML = raw_data.slice(-1)[0].v?"Bravo!":"Pigeon! Allez recommence encore une fois!";

	document.getElementById("multi_stats_current").innerHTML = `
Total: ${current_data.length}; 
Bravo:${(current_data.reduce((a,c) => {return a + c.v;},0)/current_data.length*100).toFixed(1)}%; 
Pigeon:${(100 - current_data.reduce((a,c) => {return a + c.v;},0)/current_data.length*100).toFixed(1)}%; 
Temps moyen: ${(current_data.reduce((a,c) => {return a + c.dt;},0)/current_data.length/1000).toFixed(1)}s.
`;

	show_multi_stats(all_data, "#multi_stats_all", success_fun, "% Justesse");
	show_multi_stats(session_data, "#multi_stats_session", success_fun, "% Justesse");

	show_multi_stats(all_data, "#multi_time_stats_all", time_fun, "% Temps de reponse restant (100% = 60s)");
	show_multi_stats(session_data, "#multi_time_stats_session", time_fun, "% Temps de reponse restant (100% = 60s)");

	
		
	draw();
    }});

reset();

