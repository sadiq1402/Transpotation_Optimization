import React, { useState } from "react";
import axios from "axios";
import {
    Box,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Flex,
} from "@chakra-ui/react";

function FastestSlowestRoutes({ onClose }) {
    const [routesData, setRoutesData] = useState([]); // Initialize as empty array
    const [currentPage, setCurrentPage] = useState(1); // Track the current page
    const routesPerPage = 10; // Number of routes per page
    const [selectedDate, setSelectedDate] = useState(""); // Track selected date for filtering
    const [isLoading, setIsLoading] = useState(false); // Track loading state

    // Fetch the fastest and slowest routes data when the search button is clicked
    const fetchRoutesData = async () => {
        if (!selectedDate) {
            alert("Please enter a date in YYYYMMDD format.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(
                `http://127.0.0.1:5000/api/slowest_fastest_routes`,
                {
                    params: { date: selectedDate },
                }
            );
            setRoutesData(response.data.slowest_fastest_routes);
        } catch (error) {
            console.error("Error fetching routes data:", error);
        }
        setIsLoading(false);
    };

    const indexOfLastRoute = currentPage * routesPerPage;
    const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
    const currentRoutes = routesData.slice(indexOfFirstRoute, indexOfLastRoute);

    const renderRows = () => {
        return currentRoutes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{route.route_color || "NA"}</Td>
                <Td>{route.service_speed || "NA"}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(routesData.length / routesPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Fastest and Slowest Routes
            </Text>

            {/* Date selection and search button */}
            <Flex mb={4} justifyContent="flex-start">
                <Text mr={2}>Select Date:</Text>
                <input
                    type="text"
                    placeholder="YYYYMMDD"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid gray",
                    }}
                />
                <Button
                    ml={2}
                    onClick={fetchRoutesData}
                    colorScheme="blue"
                    isLoading={isLoading} // Show a loading spinner when fetching
                >
                    Search
                </Button>
            </Flex>

            {routesData.length === 0 ? (
                <Text>No routes to display</Text>
            ) : (
                <>
                    <Table variant="striped" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Route ID</Th>
                                <Th>Route Name</Th>
                                <Th>Route Color</Th>
                                <Th>Service Speed</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderRows()}</Tbody>
                    </Table>

                    {/* Pagination */}
                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>
                            Page {currentPage} of{" "}
                            {Math.ceil(routesData.length / routesPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={
                                currentPage ===
                                Math.ceil(routesData.length / routesPerPage)
                            }
                            colorScheme="blue"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}

            {/* Close button */}
            <Box mt={4}>
                <Button colorScheme="red" onClick={onClose}>
                    Close
                </Button>
            </Box>
        </Box>
    );
}

export default FastestSlowestRoutes;
