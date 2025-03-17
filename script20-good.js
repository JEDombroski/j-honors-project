const width = 800, height = 600;
const svg = d3.select("svg").attr("width", width).attr("height", height);

// Load data
d3.json("data.json").then(data => {
    let nodes = [];
    let links = [];
    let tagMap = {};

    // Helper function to generate random positions within the screen bounds
    function getRandomPosition(nodes) {
        let x, y, overlap;
        let minDistance = 2; // Minimum distance between points

        // Ensure points are within the screen bounds
        do {
            x = Math.random() * (width - 40) + 20;  // Ensures points are within the screen bounds
            y = Math.random() * (height - 40) + 20;
            overlap = false;

            // Check overlap with existing nodes
            nodes.forEach(d => {
                const dx = x - d.x;
                const dy = y - d.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistance) { // Enforcing a minimum distance between nodes
                    overlap = true;
                }
            });
        } while (overlap);

        return { x, y };
    }

    // Populate nodes from the data
    data.forEach(item => {
        nodes.push({ id: item.title, type: "item", ...item });

        item.tags.forEach(tag => {
            if (!themeMap[tag]) {
                themeMap[tag] = { id: tag, type: "tag" };
                nodes.push(themeMap[tag]);
            }
            links.push({ source: item.title, target: tag });
        });
    });

   // Assign random positions for event nodes (items) and tag nodes ensuring they don't overlap
nodes.forEach(d => {
    if (d.type === "item" || d.type === "tag") {
        const pos = getRandomPosition(nodes);
        d.x = pos.x;
        d.y = pos.y;
    }
});


// Create a custom collision function with bounce behavior
function collideWithBounce(nodes) {
    let minDistance = 40; // Minimum distance between nodes to avoid overlap
    return function(d) {
        nodes.forEach(function(d2) {
            if (d === d2) return; // Skip if it's the same node

            const dx = d.x - d2.x;
            const dy = d.y - d2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const overlap = minDistance - distance;

            if (overlap > 0) {
                // Calculate the angle of collision and how much to push nodes apart
                const angle = Math.atan2(dy, dx);
                const pushX = Math.cos(angle) * overlap;
                const pushY = Math.sin(angle) * overlap;

                // Apply the repulsion to both nodes
                d.x += pushX;
                d.y += pushY;
                d2.x -= pushX;
                d2.y -= pushY;
            }
        });
    };
}

// Create simulation with bounce behavior and custom collision handling
// Define the simulation with more aggressive repulsion and persistent collision
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-10))  // Increase repulsion strength to prevent drifting
    .force("center", d3.forceCenter(width / 2, height / 2)) // Keep nodes centered
    .force("collide", d3.forceCollide(40))  // Apply persistent collision force with minimum distance between nodes
    .force("x", d3.forceX().strength(0.1).x(d => Math.max(20, Math.min(width - 20, d.x)))) // Keep nodes within bounds horizontally
    .force("y", d3.forceY().strength(0.1).y(d => Math.max(20, Math.min(height - 20, d.y)))) // Keep nodes within bounds vertically
    .alpha(.05)
    .alphaMin(0.01)
    .on("tick", () => {
        node.attr("cx", d => Math.max(20, Math.min(width - 20, d.x)))
            .attr("cy", d => Math.max(20, Math.min(height - 20, d.y)));

        label.attr("x", d => Math.max(20, Math.min(width - 20, d.x)))
            .attr("y", d => Math.max(20, Math.min(height - 20, d.y)));
    });

// When a tag is selected, lower the alpha decay to slow the simulation
function ontagSelected() {
    simulation.alphaTarget(0.3).restart();  // Start or speed up simulation when a tag is selected
}

// Reset the alpha decay when no tag is selected
function ontagDeselected() {
    simulation.alphaTarget(0).restart();  // Gradually stop the simulation
}





    // Create circles for the nodes
    const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.type === "tag" ? 10 : 20) // Smaller radius for tag nodes
        .attr("fill", d => d.type === "tag" ? "#FF5733" : "#3399FF") // Different colors for tags and items
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)); 

    // Add labels to the event and tag nodes
    const label = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("dx", 10)
        .attr("dy", 3);

    // Focus on a tag when clicked
    function focusOntag(tagNode) {
        // Identify the event nodes related to the selected tag
        const relatedEventNodes = links
            .filter(link => link.target === tagNode.id)
            .map(link => link.source);

        const nodeRadius = 20; // Approximate radius of event nodes
        const minRingRadius = 50; // Inner ring size (should fit the tag node)
        const spacingFactor = 2.2; // Space between rings
        let numPerRing = Math.floor((2 * Math.PI * minRingRadius) / (nodeRadius * spacingFactor)); 
        let currentLayer = 0;
        let angleStep = (2 * Math.PI) / numPerRing;
        let indexInLayer = 0;

        // Calculate the center of the circle for the tag node
        let centerX = width/2;
        let centerY = height/2;

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

                // Position the event nodes in a circular formation around the tag node
                d.fx = centerX + ringRadius * Math.cos(angle);
                d.fy = centerY + ringRadius * Math.sin(angle);

                indexInLayer++;
            } else {
                // For non-related event nodes, leave their positions to the force simulation
                d.fx = null;
                d.fy = null;
            }

            // For tag nodes that are not the selected tag, allow them to move freely
            if (d.type === "tag" && d.id !== tagNode.id) {
                d.fx = null;
                d.fy = null;
            }
        });

        // Move the tag node to the center of the circle
        tagNode.fx = centerX;
        tagNode.fy = centerY;

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

    // Add click interaction for selecting a tag
    node.on("click", (event, d) => {
        if (d.type === "tag") {
            focusOntag(d); // Focus on the clicked tag
        }
    });
});



