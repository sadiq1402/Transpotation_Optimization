import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RoutesModal() {
    const [routeData, setRouteData] = useState([]); // Initialize as an empty array
    const [currentPage, setCurrentPage] = useState(1); // State to track the current page
    const routesPerPage = 10; // Number of routes to show per page

    // Fetch data from the API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/routes');
                console.log("API Response:", response.data); // Log the response to confirm it's correct

                setRouteData(response.data);
            } catch (error) {
                console.error("Error fetching route analysis data:", error);
            }
        };
        fetchData();
    }, []);

    // Calculate the range of routes to display based on the current page
    const indexOfLastRoute = currentPage * routesPerPage;
    const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
    const currentRoutes = routeData.slice(indexOfFirstRoute, indexOfLastRoute);

    // Function to render the table rows for the current page
    const renderRows = () => {
        return currentRoutes.map((route, index) => (
            <tr key={index}>
                <td>{route.route_id || "NA"}</td>
                <td>{route.route_short_name || "NA"}</td>
                <td>{route.route_long_name || "NA"}</td>
                <td>{route.route_type || "NA"}</td>
            </tr>
        ));
    };

    // Handle "Next" button click
    const handleNextPage = () => {
        if (currentPage < Math.ceil(routeData.length / routesPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Handle "Previous" button click
    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <>
            <div>This is coming from RoutesModal</div>
            {routeData.length === 0 ? (
                <p>No routes to display</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Route ID</th>
                                <th>Route Short Name</th>
                                <th>Route Long Name</th>
                                <th>Route Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderRows()}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div style={{ marginTop: '20px' }}>
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            style={{ marginRight: '10px' }}
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {Math.ceil(routeData.length / routesPerPage)}</span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === Math.ceil(routeData.length / routesPerPage)}
                            style={{ marginLeft: '10px' }}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

export default RoutesModal;
