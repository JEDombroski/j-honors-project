const width = 800, height = 600;
const svg = d3.select("svg").attr("width", width).attr("height", height);

// Load data
d3.json("data.json").then(data => {
    let nodes = [];
    let links = [];
    let themeMap = {};

    // Populate nodes from the data
    data.forEach(item => {
        nodes.push({ id: item.title, type: "item", ...item });

        item.themes.forEach(theme => {
            if (!themeMap[theme]) {
                themeMap[theme] = { id: theme, type: "theme" };
                nodes.push(themeMap[theme]);
            }
            links.push({ source: item.title, target: theme });
        });
    });

    // Randomize positions for event nodes (items) within the screen bounds
    nodes.forEach(d => {
        if (d.type === "item") {
            // Ensure random placement is within screen boundaries (0 to width/height)
            d.x = Math.random() * (width - 40) + 20; // Add padding to ensure points stay within bounds
            d.y = Math.random() * (height - 40) + 20; // Add padding to ensure points stay within bounds
        }
    });

    // Create simulation for node positioning
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100)) 
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Create circles for nodes
    const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.type === "theme" ? 10 : 20)
        .attr("fill", d => d.type === "theme" ? "#FF5733" : "#3399FF")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add labels
    const label = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("dx", 10)
        .attr("dy", 3);

    // Tooltip for details
    const tooltip = d3.select(".tooltip");

    node.on("mouseover", (event, d) => {
        tooltip.style("display", "block")
            .html(`<strong>${d.id}</strong><br>${d.description || ""}`)
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px");
    }).on("mouseout", () => tooltip.style("display", "none"));

    // Simulation tick function
    simulation.on("tick", () => {
        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label.attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
});


