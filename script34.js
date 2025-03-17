// Set up SVG dimensions (larger than the window size)
//const width = window.innerWidth;  // Larger width than the window
//const height = window.innerHeight;  // Larger height than the window

//console.log(`Initial Width: ${width}, Initial Height: ${height}`);

// Create an SVG element
//const svg = d3.select("body")
//    .append("svg")
//    .attr("width", width)  // Set SVG width larger than the window size
//   // .attr("viewBox", `0 0 ${width} ${height}`)  // Allow it to scale and scroll
   // .attr("preserveAspectRatio", "xMinYMin")  // Ensure proper scaling when resizing
	//.call(d3.zoom()
   //	 .scaleExtent([1, 10])  // Define zoom scale limits
   //	 .on("zoom", zoomed));

//function zoomed(event) {
 // svg.attr("transform", event.transform);  // Apply zoom and pan transformations
//}

// Define width and height globally to use them in different parts of the script
let width = window.innerWidth;
let height = window.innerHeight;

// Create an SVG element
/*const svg = d3.select("body")
    .append("svg")
    .attr("width", width)  // Set SVG width dynamically
    .attr("height", height) // Set SVG height dynamically
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0"); */
    
    const svg = d3.select(".right-column")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .style("position", "absolute") // Make sure the SVG is absolute
    .style("top", "0");
    

// Function to update the SVG dimensions and viewBox based on window size
function updateViewBox() {
    width = window.innerWidth;  // Update width dynamically
    height = window.innerHeight; // Update height dynamically

    // Log the dimensions for debugging
    console.log(`Updated SVG Width: ${width}, Updated SVG Height: ${height}`); 

    // Update the viewBox for the SVG to match the window size
    svg.attr("viewBox", `0 0 ${width} ${height}`);
}

// Call updateViewBox on load
updateViewBox();

// Update the viewBox on window resize
window.addEventListener("resize", updateViewBox);


// Load data
d3.json("updated_datacopy.json").then(data => {
    let nodes = [];
    let links = [];
    let themeMap = {};
    

    // Helper function to generate random positions within the screen bounds
    function getRandomPosition(nodes) {
        let x, y, overlap;
        let minDistance = Math.min(width, height) * 0.001; // Minimum distance between points

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

if (item.themes && Array.isArray(item.themes)) {
    item.themes.forEach(theme => {
        console.log(theme);
    });
} else {
    console.warn("Themes missing or not an array:", item);
}


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
    let minDistance = Math.min(width, height) * 0.001; // Minimum distance between nodes to avoid overlap
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
    .force("charge", d3.forceManyBody().strength(-20))  // Increase repulsion strength to prevent drifting
    .force("center", d3.forceCenter(width/2, height/2)) // Keep nodes centered
    .force("collide", d3.forceCollide(30))  // Apply persistent collision force with minimum distance between nodes
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

// Create a tooltip div to show on hover
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")  // Hidden by default
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("font-size", "12px")
    .style("pointer-events", "none");  // Prevent the tooltip from interfering with mouse events

// Create the info box (popup) div
const infoBox = d3.select("body")
    .append("div")
    .attr("class", "infoBox")
    .style("position", "absolute")
    .style("visibility", "block")  // Hide by default
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("font-size", "12px")
    .style("pointer-events", "none");  // Prevent it from interfering with mouse events
    
    console.log('Info Box created:', infoBox);


    // Create circles for the nodes
    const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.type === "theme" ? 20 : 10) // Smaller radius for event nodes
        .attr("fill", d => d.type === "theme" ? "#9768d1" : "#25064c") // Different colors for themes and items
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
             // Add mouse event listeners for tooltip
    .on("mouseover", (event, d) => {
        if (d.type === "item") {  // Only show tooltip for item nodes
            tooltip.style("visibility", "visible")
                .html(`<strong>Name:</strong> ${d.id} <br> <strong>Date:</strong> ${d.date}`)
                .style("top", (event.pageY + 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        }
    })
    .on("mousemove", (event, d) => {
        tooltip.style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
    });
    

    // Add labels to the event and theme nodes
    const label = svg.selectAll("text")
        .data(nodes.filter(d => d.type === "theme"))
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("dx", 0)
        .attr("dy", 3)
        .style("pointer-events", "none");  // Make labels click-through;
        
let currentSelectedTheme = null;  // Track the currently selected theme node


    // Focus on a theme when clicked
    function focusOnTheme(themeNode) {
       if (currentSelectedTheme === themeNode) {
    nodes.forEach(d => {
        if (d.type === "item") {  // Reset fx and fy for event nodes (items)
            d.fx = Math.random() * (width - 40) + 20;  // Random x position
            d.fy = Math.random() * (height - 40) + 20; // Random y position
        }
        
        d.opacity = 1;  // Full opacity for all nodes
    });
    updateNodeOpacity();
    
    
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
                
				d.opacity = 1;
                indexInLayer++;
            } else {
                // For non-related event nodes, leave their positions to the force simulation
                d.fx = null;
                d.fy = null;
                
                d.opacity = 0.3;
            }

            // For theme nodes that are not the selected theme, allow them to move freely
            if (d.type === "theme" && d.id !== themeNode.id) {
                d.fx = null;
                d.fy = null;
                
                d.opacity = 1;
            }
        });

        // Move the theme node to the center of the circle
        themeNode.fx = centerX;
        themeNode.fy = centerY;
        
        themeNode.opacity = 1;
         updateNodeOpacity();
        
        currentSelectedTheme = themeNode;
		}
        simulation.alpha(1).restart();
    }
    
    // Function to update the opacity of all nodes based on their current opacity value
function updateNodeOpacity() {
    node.transition()
        .duration(500)
        .style("fill-opacity", d => d.opacity || 1);  // Apply opacity changes
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
        else if (d.type === "item") {
        showModal(d);  // Show modal with event data
    }
        })
        
        // Reference to the modal and close button
const modal = document.getElementById("eventModal");
const closeBtn = document.getElementById("closeBtn");

function showModal(eventData) {
    console.log("Event Data:", eventData); // Debugging: Check eventData structure
    console.log("Photos:", eventData.photoFilenames);

    // Set modal content
    document.getElementById("modalTitle").innerText = eventData.id;
    document.getElementById("modalDate").innerText = eventData.date;
    document.getElementById("modalDescription").innerText = eventData.description;

    // Clear out any previous images in the modal
    const modalPhotos = document.getElementById("modalPhotos");
    modalPhotos.innerHTML = '';  // Reset modal content

    // Check if event data has a photos field and it's not empty
    if (eventData.photoFilenames && eventData.photoFilenames.length > 0) {
        console.log("photo present");
        eventData.photoFilenames.forEach(photoUrl => {
        	const jpgUrl = photoUrl.replace(".HEIC", ".jpg");
        	console.log(jpgUrl);
            const fullPhotoUrl = "images/" + jpgUrl;  // Correct path for images
            console.log("Full photo URL:", fullPhotoUrl); // Debugging

            if (fullPhotoUrl.endsWith(".HEIC")) {
                // Convert HEIC image
                fetch(fullPhotoUrl)
                    .then(response => response.blob())
                    .then(blob => {
                        heic2any({
                            blob: blob,
                            toType: "image/jpeg"
                        }).then(convertedBlob => {
                            const imgElement = document.createElement('img');
                            imgElement.src = URL.createObjectURL(convertedBlob);
                            modalPhotos.appendChild(imgElement);
                        });
                    })
                    .catch(error => {
                        console.error("Error converting HEIC image:", error);
                        modalPhotos.innerHTML = "Error loading photo.";
                    });
            } else {
                // Not a HEIC file, just display it
                const imgElement = document.createElement('img');
                imgElement.src = fullPhotoUrl;  // Correct path for images
                modalPhotos.appendChild(imgElement);
            }
        });
    } else {
        modalPhotos.innerHTML = "No photos available for this event.";
    }

    // Show the modal
    document.getElementById("eventModal").style.display = "block";  // Make modal visible
}

// Close modal functionality
document.getElementById("closeBtn").addEventListener("click", function() {
    document.getElementById("eventModal").style.display = "none";  // Hide the modal
});

// Example: Add event listener to nodes
document.querySelectorAll('.your-node-selector').forEach(node => {
    node.addEventListener('click', function() {
        // Assuming 'eventData' is the relevant data for this node
        showModal(eventData); // Call showModal when a node is clicked
    });
});




// Close the modal when "X" button is clicked
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// Close the modal if the user clicks anywhere outside the modal
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        
        
    }
}

    //});
});



