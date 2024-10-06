import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
} from '@chakra-ui/react';

function RoutesModal() {
    const [routeData, setRouteData] = useState([]); // Initialize as an empty array
    const [currentPage, setCurrentPage] = useState(1); // State to track the current page
    const routesPerPage = 10; // Number of routes to show per page

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

    const indexOfLastRoute = currentPage * routesPerPage;
    const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
    const currentRoutes = routeData.slice(indexOfFirstRoute, indexOfLastRoute);

    const renderRows = () => {
        return currentRoutes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_short_name || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{route.route_type || "NA"}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(routeData.length / routesPerPage)) {
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
            <Text fontSize="2xl" mb={4}>Routes Information</Text>
            {routeData.length === 0 ? (
                <Text>No routes to display</Text>
            ) : (
                <>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Route ID</Th>
                                <Th>Route Short Name</Th>
                                <Th>Route Long Name</Th>
                                <Th>Route Type</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {renderRows()}
                        </Tbody>
                    </Table>

                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>Page {currentPage} of {Math.ceil(routeData.length / routesPerPage)}</Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === Math.ceil(routeData.length / routesPerPage)}
                            colorScheme="blue"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}
        </Box>
    );
}

export default RoutesModal;
