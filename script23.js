// Set up SVG dimensions (larger than the window size)
const width = window.innerWidth;  // Larger width than the window
const height = window.innerHeight;  // Larger height than the window

console.log(`Initial Width: ${width}, Initial Height: ${height}`);

// Create an SVG element
const svg = d3.select("body")
    .append("svg")
    .attr("width", width)  // Set SVG width larger than the window size
    .attr("height", height)  // Set SVG height larger than the window size
   // .attr("viewBox", `0 0 ${width} ${height}`)  // Allow it to scale and scroll
   // .attr("preserveAspectRatio", "xMinYMin")  // Ensure proper scaling when resizing
	//.call(d3.zoom()
   //	 .scaleExtent([1, 10])  // Define zoom scale limits
   //	 .on("zoom", zoomed));

//function zoomed(event) {
 // svg.attr("transform", event.transform);  // Apply zoom and pan transformations
//}


// Load data
d3.json("updated_data.json").then(data => {
    let nodes = [];
    let links = [];
    let themeMap = {};
    

    // Helper function to generate random positions within the screen bounds
    function getRandomPosition(nodes) {
        let x, y, overlap;
        let minDistance = Math.min(width, height) * 0.05; // Minimum distance between points

        // Ensure points are within the screen bounds
        do {
            x = Math.random() * (width - 40) + 20;
           // x=Math.random() * width;  // Ensures points are within the screen bounds
            y = Math.random() * (height - 40) + 20;
            //y=Math.random() * height
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

        item.themes.forEach(theme => {
            if (!themeMap[theme]) {
                themeMap[theme] = { id: theme, type: "theme" };
                nodes.push(themeMap[theme]);
            }
            links.push({ source: item.title, target: theme });
        });
    });

   // Assign random positions for event nodes (items) and theme nodes ensuring they don't overlap
nodes.forEach(d => {
    if (d.type === "item" || d.type === "theme") {
        const pos = getRandomPosition(nodes);
        d.x = pos.x;
        d.y = pos.y;
    }
});


// Handle zooming (apply transformation to the entire SVG content)
//function zoomed(event) {
//    svg.attr("transform", event.transform);  // Apply zoom and pan transformations
//}

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
    .force("center", d3.forceCenter(width/2, height/2)) // Keep nodes centered
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
    
    window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.attr("width", newWidth).attr("height", newHeight);

    // Update the center force for D3 simulation
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(1).restart();  // Restart simulation to apply new forces
});

// When a theme is selected, lower the alpha decay to slow the simulation
function onThemeSelected() {
    simulation.alphaTarget(0.3).restart();  // Start or speed up simulation when a theme is selected
}

// Reset the alpha decay when no theme is selected
function onThemeDeselected() {
    simulation.alphaTarget(0).restart();  // Gradually stop the simulation
}





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

    // Add labels to the event and theme nodes
    const label = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("dx", 10)
        .attr("dy", 3);
        
let currentSelectedTheme = null;  // Track the currently selected theme node


    // Focus on a theme when clicked
    function focusOnTheme(themeNode) {
       if (currentSelectedTheme === themeNode) {
    nodes.forEach(d => {
        if (d.type === "item") {  // Reset fx and fy for event nodes (items)
            d.fx = Math.random() * (width - 40) + 20;  // Random x position
            d.fy = Math.random() * (height - 40) + 20; // Random y position
        }
    });
} else {

       
        // Identify the event nodes related to the selected theme
        const relatedEventNodes = links
            .filter(link => link.target === themeNode.id)
            .map(link => link.source);

        const nodeRadius = 20; // Approximate radius of event nodes
        const minRingRadius = 50; // Inner ring size (should fit the theme node)
        const spacingFactor = 2.2; // Space between rings
        let numPerRing = Math.floor((2 * Math.PI * minRingRadius) / (nodeRadius * spacingFactor)); 
        let currentLayer = 0;
        let angleStep = (2 * Math.PI) / numPerRing;
        let indexInLayer = 0;

        // Calculate the center of the circle for the theme node
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

                // Position the event nodes in a circular formation around the theme node
                d.fx = centerX + ringRadius * Math.cos(angle);
                d.fy = centerY + ringRadius * Math.sin(angle);

                indexInLayer++;
            } else {
                // For non-related event nodes, leave their positions to the force simulation
                d.fx = null;
                d.fy = null;
            }

            // For theme nodes that are not the selected theme, allow them to move freely
            if (d.type === "theme" && d.id !== themeNode.id) {
                d.fx = null;
                d.fy = null;
            }
        });

        // Move the theme node to the center of the circle
        themeNode.fx = centerX;
        themeNode.fy = centerY;
        
        currentSelectedTheme = themeNode;
		}
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

    // Add click interaction for selecting a theme
    node.on("click", (event, d) => {
        if (d.type === "theme") {
            focusOnTheme(d); // Focus on the clicked theme
        }
    });
});



