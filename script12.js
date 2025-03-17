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

nodes.forEach(d => {
    d.x = Math.random() * (width - 40) + 20;  // Ensures points stay inside the screen
    d.y = Math.random() * (height - 40) + 20;
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
            
     // Add click event to theme nodes
node.filter(d => d.type === "theme").on("click", (event, d) => {
    focusOnTheme(d);
});


 // Event Labels (for item nodes)
const eventLabels = svg.selectAll("text.event-label")
    .data(nodes.filter(d => d.type === "item")) // Only for event nodes
    .enter().append("text")
    .attr("class", "event-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .text(d => d.id)
    .attr("font-size", "12px")
    .attr("dx", 22) // Shift to right of event nodes (radius 20px + padding)
    .attr("dy", 3);  // Adjust vertical alignment

// Theme Labels (for theme nodes)
const themeLabels = svg.selectAll("text.theme-label")
    .data(nodes.filter(d => d.type === "theme")) // Only for theme nodes
    .enter().append("text")
    .attr("class", "theme-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .text(d => d.id)
    .attr("font-size", "12px")
    .attr("dx", 16) // Shift to right of theme nodes (radius 10px + padding)
    .attr("dy", 3);  // Adjust vertical alignment


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

            eventLabels.attr("x", d => d.x + 5) // Keep event labels to the right
        .attr("y", d => d.y);

    themeLabels.attr("x", d => d.x + 5) // Keep theme labels to the right
        .attr("y", d => d.y);
    });

function focusOnTheme(themeNode) {
    const relatedEventNodes = links
        .filter(link => link.target === themeNode.id)
        .map(link => link.source);

    const eventCount = relatedEventNodes.length;
    const nodeRadius = 20; // Approximate radius of event nodes
    const minRingRadius = 50; // Inner ring size (should fit the theme node)
    const spacingFactor = 2.2; // Space between rings
    let numPerRing = Math.floor((2 * Math.PI * minRingRadius) / (nodeRadius * spacingFactor)); 
    let currentLayer = 0;
    let angleStep = (2 * Math.PI) / numPerRing;
    let indexInLayer = 0;

    // Calculate the center of the circle for the theme node
    let centerX = themeNode.x;
    let centerY = themeNode.y;

    // Assign positions based on layers
    nodes.forEach(d => {
        if (relatedEventNodes.includes(d.id)) {
            if (indexInLayer >= numPerRing) {
                currentLayer++; // Move to next layer
                numPerRing = Math.floor((2 * Math.PI * (minRingRadius + currentLayer * nodeRadius * spacingFactor)) / (nodeRadius * spacingFactor));
                indexInLayer = 0;
                angleStep = (2 * Math.PI) / numPerRing;
            }

            let ringRadius = minRingRadius + currentLayer * nodeRadius * spacingFactor;
            let angle = indexInLayer * angleStep;

            // Position the event nodes in a circular formation around the theme node
            d.fx = centerX + ringRadius * Math.cos(angle);
            d.fy = centerY + ringRadius * Math.sin(angle);

            indexInLayer++;
        } else {
            d.fx = null; // Unrelated nodes remain free-floating
            d.fy = null;
        }
    });

    // Move the theme node to the center of the circle
    themeNode.fx = centerX;
    themeNode.fy = centerY;

    simulation.alpha(1).restart();
}




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



