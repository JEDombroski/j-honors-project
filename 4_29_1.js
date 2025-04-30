const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#graph")
  .attr("width", width)
  .attr("height", height);

d3.json("nodes.json").then(data => {
  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2 + 100, height / 2))
    .force("collision", d3.forceCollide().radius(50))
    .alphaTarget(0.1)
    .velocityDecay(0.2)
    .on("tick", ticked);

  const link = svg.append("g")
    .attr("stroke", "#aaa")
    .selectAll("line")
    .data(data.links)
    .enter().append("line");

  const node = svg.append("g")
    .selectAll("circle")
    .data(data.nodes)
    .enter().append("circle")
      .attr("r", d => d.type === "tertiary" ? 8 : 20)
      .attr("fill", d => d.type === "primary" ? "#1f77b4" : d.type === "secondary" ? "#ff7f0e" : "#2ca02c")
      .call(drag(simulation))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick);

  const label = svg.append("g")
    .selectAll("text")
    .data(data.nodes.filter(d => d.type !== "tertiary"))
    .enter().append("text")
      .text(d => d.text)
      .attr("font-size", 12)
      .attr("dx", 10)
      .attr("dy", 4);

  function ticked() {
    link
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x).attr("cy", d => d.y);

    label
      .attr("x", d => d.x).attr("y", d => d.y);
  }

  function drag(simulation) {
    return d3.drag()
      .on("start", event => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", event => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", event => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }

  function handleMouseOver(event, d) {
    if (d.type === "tertiary") {
      const popup = d3.select("#hover-popup");
      popup.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px")
        .style("display", "block")
        .text(d.hover || "No info");
    }
  }

  function handleMouseOut(event, d) {
    d3.select("#hover-popup").style("display", "none");
  }

  function handleClick(event, d) {
    if (d.detail) {
      const popup = d3.select("#detail-popup");
      popup.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px")
        .style("display", "block")
        .html("<strong>Detail:</strong><br>" + d.detail);
    }
  }

});