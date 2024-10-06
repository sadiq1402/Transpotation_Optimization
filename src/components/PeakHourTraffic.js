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
    Input,
    InputGroup,
    InputRightElement,
    Spinner,
    Flex,
    VStack,
} from "@chakra-ui/react";

function PeakHourTraffic({ onClose }) {
    const [peakHourRoutes, setPeakHourRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Number of items per page

    // Handle search request
    const handleSearch = async () => {
        if (searchDate.trim() === "") {
            setError("Please enter a date");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `http://127.0.0.1:5000/api/peak_hour_traffic?date=${searchDate}`
            );
            if (response.status === 200) {
                setPeakHourRoutes(response.data.peak_hour_routes);
                setCurrentPage(1); // Reset to page 1 after new data is fetched
            } else {
                setError("Error fetching peak hour traffic data.");
            }
        } catch (err) {
            setError("Error fetching peak hour traffic data.");
        } finally {
            setLoading(false);
        }
    };

    // Pagination logic
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    const currentItems = peakHourRoutes.slice(firstIndex, lastIndex);

    const totalPages = Math.ceil(peakHourRoutes.length / itemsPerPage);

    const nextPage = () =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Peak Hour Traffic
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
                    {currentItems.length > 0 && (
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th>Route ID</Th>
                                    <Th>Route Name</Th>
                                    <Th>Route Color</Th>
                                    <Th>Number of Trips</Th>
                                    <Th>Time Periods</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {currentItems.map((route, index) => (
                                    <Tr key={index}>
                                        <Td>{route.route_id}</Td>
                                        <Td>{route.route_long_name}</Td>
                                        <Td>{route.route_color}</Td>
                                        <Td>{route.trip_id}</Td>
                                        <Td>{route.time_period.join(", ")}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}

                    {/* Pagination Controls */}
                    <Flex justifyContent="space-between" mt={4}>
                        <Button onClick={prevPage} disabled={currentPage === 1}>
                            Previous
                        </Button>
                        <Text>
                            Page {currentPage} of {totalPages}
                        </Text>
                        <Button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </Flex>
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

export default PeakHourTraffic;
