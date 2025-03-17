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

    // Create simulation for node positioning
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-100))  // Repulsion to spread nodes
        .force("center", d3.forceCenter(width / 2, height / 3)); // Keeps nodes centered

    // Create circles for the nodes
    const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.type === "theme" ? 10 : 20) // Smaller radius for theme nodes
        .attr("fill", d => d.type === "theme" ? "#FF5733" : "#3399FF") // Different colors for themes and items
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add labels to the nodes
    const label = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("dx", 10)
        .attr("dy", 3);

    // Tooltip for details on hover
    const tooltip = d3.select(".tooltip");

    node.on("mouseover", (event, d) => {
        tooltip.style("display", "block")
            .html(`<strong>${d.id}</strong><br>${d.description || ""}`)
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px");
    }).on("mouseout", () => tooltip.style("display", "none"));

    // Simulation tick function: update node positions
    simulation.on("tick", () => {
        node.attr("cx", d => {
            d.x = Math.max(20, Math.min(width - 20, d.x)); // Keep nodes inside width
            return d.x;
        })
        .attr("cy", d => {
            d.y = Math.max(20, Math.min(height - 20, d.y)); // Keep nodes inside height
            return d.y;
        });

        label.attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    // Dragging functionality
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



