import React, { useState, useEffect } from "react";
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
    VStack,
    Input,
    InputGroup,
    InputRightElement,
    Spinner,
} from "@chakra-ui/react";

function FrequentRoutesModal({ onClose }) {
    const [frequentRoutes, setFrequentRoutes] = useState({
        most_frequent_routes: [],
        least_frequent_routes: [],
    });
    const [currentPageMost, setCurrentPageMost] = useState(1);
    const [currentPageLeast, setCurrentPageLeast] = useState(1);
    const [routesPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [isSearched, setIsSearched] = useState(false);

    useEffect(() => {
        if (isSearched) {
            fetchRoutesData(searchDate);
        }
    }, [searchDate, isSearched]);

    const fetchRoutesData = async (date) => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(
                `http://127.0.0.1:5000/api/frequent_routes?date=${date}`
            );
            if (response.status === 200) {
                setFrequentRoutes(response.data);
            } else {
                setError("Error fetching frequent routes");
            }
        } catch (err) {
            setError("Error fetching frequent routes");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchDate.trim() === "") {
            setError("Please enter a date");
        } else {
            setIsSearched(true);
            setCurrentPageMost(1);
            setCurrentPageLeast(1);
        }
    };

    // Pagination for Most Frequent Routes
    const indexOfLastMostRoute = currentPageMost * routesPerPage;
    const indexOfFirstMostRoute = indexOfLastMostRoute - routesPerPage;
    const currentMostFrequentRoutes = frequentRoutes.most_frequent_routes.slice(
        indexOfFirstMostRoute,
        indexOfLastMostRoute
    );

    // Pagination for Least Frequent Routes
    const indexOfLastLeastRoute = currentPageLeast * routesPerPage;
    const indexOfFirstLeastRoute = indexOfLastLeastRoute - routesPerPage;
    const currentLeastFrequentRoutes =
        frequentRoutes.least_frequent_routes.slice(
            indexOfFirstLeastRoute,
            indexOfLastLeastRoute
        );

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Frequent Routes Analysis
            </Text>

            {/* Search Bar */}
            <InputGroup mb={4}>
                <Input
                    placeholder="Enter date (YYYYMMDD)"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                />
                <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleSearch}>
                        Search
                    </Button>
                </InputRightElement>
            </InputGroup>

            {loading ? (
                <Spinner size="lg" />
            ) : error ? (
                <Text color="red.500">{error}</Text>
            ) : (
                <>
                    {frequentRoutes.most_frequent_routes.length > 0 && (
                        <>
                            <Text fontSize="lg" mb={2}>
                                Most Frequent Routes
                            </Text>
                            <Table variant="simple" size="sm" mb={6}>
                                <Thead>
                                    <Tr>
                                        <Th>Route ID</Th>
                                        <Th>Route Name</Th>
                                        <Th>Route Color</Th>
                                        <Th>Max Headway</Th>
                                        <Th>Min Headway</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {currentMostFrequentRoutes.map(
                                        (route, index) => (
                                            <Tr key={index}>
                                                <Td>{route.route_id}</Td>
                                                <Td>{route.route_long_name}</Td>
                                                <Td>{route.route_color}</Td>
                                                <Td>{route.max_headway}</Td>
                                                <Td>{route.min_headway}</Td>
                                            </Tr>
                                        )
                                    )}
                                </Tbody>
                            </Table>

                            {/* Pagination for Most Frequent Routes */}
                            <Flex justify="space-between" mt={4}>
                                <Button
                                    onClick={() =>
                                        setCurrentPageMost((prev) =>
                                            Math.max(prev - 1, 1)
                                        )
                                    }
                                    disabled={currentPageMost === 1}
                                    colorScheme="blue"
                                >
                                    Previous
                                </Button>
                                <Text>
                                    Page {currentPageMost} of{" "}
                                    {Math.ceil(
                                        frequentRoutes.most_frequent_routes
                                            .length / routesPerPage
                                    )}
                                </Text>
                                <Button
                                    onClick={() =>
                                        setCurrentPageMost((prev) =>
                                            Math.min(
                                                prev + 1,
                                                Math.ceil(
                                                    frequentRoutes
                                                        .most_frequent_routes
                                                        .length / routesPerPage
                                                )
                                            )
                                        )
                                    }
                                    colorScheme="blue"
                                    disabled={
                                        currentPageMost ===
                                        Math.ceil(
                                            frequentRoutes.most_frequent_routes
                                                .length / routesPerPage
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            </Flex>
                        </>
                    )}

                    {frequentRoutes.least_frequent_routes.length > 0 && (
                        <>
                            <Text fontSize="lg" mb={2}>
                                Least Frequent Routes
                            </Text>
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th>Route ID</Th>
                                        <Th>Route Name</Th>
                                        <Th>Route Color</Th>
                                        <Th>Max Headway</Th>
                                        <Th>Min Headway</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {currentLeastFrequentRoutes.map(
                                        (route, index) => (
                                            <Tr key={index}>
                                                <Td>{route.route_id}</Td>
                                                <Td>{route.route_long_name}</Td>
                                                <Td>{route.route_color}</Td>
                                                <Td>{route.max_headway}</Td>
                                                <Td>{route.min_headway}</Td>
                                            </Tr>
                                        )
                                    )}
                                </Tbody>
                            </Table>

                            {/* Pagination for Least Frequent Routes */}
                            <Flex justify="space-between" mt={4}>
                                <Button
                                    onClick={() =>
                                        setCurrentPageLeast((prev) =>
                                            Math.max(prev - 1, 1)
                                        )
                                    }
                                    disabled={currentPageLeast === 1}
                                    colorScheme="blue"
                                >
                                    Previous
                                </Button>
                                <Text>
                                    Page {currentPageLeast} of{" "}
                                    {Math.ceil(
                                        frequentRoutes.least_frequent_routes
                                            .length / routesPerPage
                                    )}
                                </Text>
                                <Button
                                    onClick={() =>
                                        setCurrentPageLeast((prev) =>
                                            Math.min(
                                                prev + 1,
                                                Math.ceil(
                                                    frequentRoutes
                                                        .least_frequent_routes
                                                        .length / routesPerPage
                                                )
                                            )
                                        )
                                    }
                                    colorScheme="blue"
                                    disabled={
                                        currentPageLeast ===
                                        Math.ceil(
                                            frequentRoutes.least_frequent_routes
                                                .length / routesPerPage
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            </Flex>
                        </>
                    )}
                </>
            )}

            {/* Close button */}
            <VStack mt={4}>
                <Button colorScheme="red" onClick={onClose}>
                    Close
                </Button>
            </VStack>
        </Box>
    );
}

export default FrequentRoutesModal;
