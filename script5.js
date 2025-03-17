// Define some constants for the canvas size
const width = 800, height = 600;
const svg = d3.select("svg").attr("width", width).attr("height", height);

// Load data
d3.json("data.json").then(data => {
    let nodes = [];
    let links = [];
    let themeMap = {};

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

    // Random positions for event nodes (items)
    nodes.forEach(d => {
        d.x = Math.random() * width;
        d.y = Math.random() * height;
    });

    // Store original positions for reset
    nodes.forEach(d => {
        d.originalX = d.x;
        d.originalY = d.y;
    });

    // Create a simulation for node positioning
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100)) // Kept but no links will be drawn
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Remove links (lines)
    // No lines will be drawn because the "link" creation step is removed
    svg.selectAll("line").remove();

    // Draw nodes (circles)
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

    let themeSelected = null;

    node.on("click", (event, d) => {
        if (d.type === "theme") {
            const clickedTheme = d.id;

            // If this theme is already selected, reset positions
            if (themeSelected === clickedTheme) {
                svg.selectAll("circle")
                    .transition()
                    .duration(500)
                    .attr("cx", d => d.originalX) // Reset x
                    .attr("cy", d => d.originalY) // Reset y
                    .attr("opacity", 1);  // Restore opacity

                themeSelected = null;

                d3.select("#event-list ul").html(""); // Clear event list
            } else {
                // Select theme and move event nodes in a circle around the theme
                const relatedLinks = links.filter(link => link.source.id === clickedTheme || link.target.id === clickedTheme);
                const relatedNodes = new Set(relatedLinks.map(link => link.source.id === clickedTheme ? link.target.id : link.source.id));

                // Ensure only related nodes are affected
                svg.selectAll("circle")
                    .transition()
                    .duration(500)
                    .attr("opacity", d => relatedNodes.has(d.id) ? 1 : 0.1); // Fade non-related nodes

                // Move related event nodes to a circular arrangement around the theme node
                const angleStep = (Math.PI * 2) / relatedNodes.size;
                let angle = 0;

                svg.selectAll("circle")
                    .transition()
                    .duration(500)
                    .attr("cx", d => {
                        if (relatedNodes.has(d.id)) {
                            // Calculate circular positions
                            return width / 2 + 100 * Math.cos(angle);
                        }
                        return d.x; // Keep non-related nodes in place
                    })
                    .attr("cy", d => {
                        if (relatedNodes.has(d.id)) {
                            // Calculate circular positions
                            return height / 2 + 100 * Math.sin(angle);
                        }
                        return d.y; // Keep non-related nodes in place
                    })
                    .attr("opacity", 1); // Ensure nodes remain visible

                // Update the event list for the selected theme
                const relatedEvents = data.filter(item => item.themes.includes(clickedTheme));

                d3.select("#event-list ul").html(""); // Clear previous list

                relatedEvents.forEach(event => {
                    d3.select("#event-list ul")
                        .append("li")
                        .text(event.title + ": " + event.description);
                });

                themeSelected = clickedTheme;
            }
        }
    });
});

