import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Box,
    Button,
    Select,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useToast,
    Spinner,
    Text,
} from "@chakra-ui/react";

const TripPlanner = () => {
    const [stops, setStops] = useState([]);
    const [results, setResults] = useState({ trips_between_stops: [] });
    const [startStop, setStartStop] = useState("");
    const [endStop, setEndStop] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useToast();

    useEffect(() => {
        fetchStops();
    }, []);

    const fetchStops = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/stops");
            setStops(response.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch stops",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const normalizeStopName = (stopName) => {
        return stopName.trim().replace(/\s+/g, " ");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!startStop || !endStop) {
            toast({
                title: "Error",
                description: "Please select both start and end stops.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);

        try {
            const encodedStartStop = encodeURIComponent(
                normalizeStopName(startStop)
            ).replace(/%20/g, "%20");
            const encodedEndStop = encodeURIComponent(
                normalizeStopName(endStop)
            ).replace(/%20/g, "%20");

            const url = `http://127.0.0.1:5000/api/trips_between_stops?start_stop_name=${encodedStartStop}&end_stop_name=${encodedEndStop}`;

            console.log("Requesting URL:", url);

            const response = await axios.get(url);

            if (response.data && response.data.trips_between_stops) {
                setResults(response.data);
            } else {
                setResults({ trips_between_stops: [] });
                toast({
                    title: "No Results",
                    description: "No trips found between the selected stops.",
                    status: "info",
                    duration: 5000,
                    isClosable: true,
                });
            }
            setCurrentPage(1);
        } catch (error) {
            console.error("API Error:", error.response || error);
            setResults({ trips_between_stops: [] });

            const errorMessage =
                error.response?.data?.error ||
                "An error occurred while fetching trips.";

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderTableRows = () => {
        if (!results.trips_between_stops?.length) {
            return (
                <Tr>
                    <Td colSpan={4}>No trips found for the selected stops.</Td>
                </Tr>
            );
        }

        const startIndex = (currentPage - 1) * 10;
        const endIndex = startIndex + 10;
        const pageTrips = results.trips_between_stops.slice(
            startIndex,
            endIndex
        );

        return pageTrips.map((trip, index) => (
            <Tr key={index}>
                <Td>
                    <Box
                        display="inline-block"
                        width="20px"
                        height="20px"
                        backgroundColor={`#${trip.route_color || "FFFFFF"}`}
                        marginRight={2}
                    />
                    {trip.route_short_name} - {trip.route_long_name}
                </Td>
                <Td>{trip.trip_id}</Td>
                <Td>
                    {trip.duration
                        ? `${(trip.duration * 60).toFixed(0)} seconds`
                        : "N/A"}
                </Td>
                <Td>
                    {trip.distance ? `${trip.distance.toFixed(2)} km` : "N/A"}
                </Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => prev + 1);
    };

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const totalResults = results.total_results || 0;
    const totalPages = Math.ceil(totalResults / 10);

    return (
        <Box p={4}>
            <form onSubmit={handleSubmit}>
                <Select
                    value={startStop}
                    onChange={(e) => setStartStop(e.target.value)}
                    placeholder="Select start stop"
                    mb={4}
                >
                    {stops.map((stop) => (
                        <option key={stop.stop_id} value={stop.stop_name}>
                            {stop.stop_name}
                        </option>
                    ))}
                </Select>

                <Select
                    value={endStop}
                    onChange={(e) => setEndStop(e.target.value)}
                    placeholder="Select end stop"
                    mb={4}
                >
                    {stops.map((stop) => (
                        <option key={stop.stop_id} value={stop.stop_name}>
                            {stop.stop_name}
                        </option>
                    ))}
                </Select>

                <Button type="submit" colorScheme="teal" isLoading={isLoading}>
                    Find Trips
                </Button>
            </form>

            {startStop && endStop && (
                <Text mt={4} mb={2}>
                    Showing trips from {startStop} to {endStop}
                </Text>
            )}

            {isLoading ? (
                <Spinner mt={4} />
            ) : (
                <>
                    <Table variant="simple" mt={4}>
                        <Thead>
                            <Tr>
                                <Th>Route</Th>
                                <Th>Trip ID</Th>
                                <Th>Duration</Th>
                                <Th>Distance</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderTableRows()}</Tbody>
                    </Table>

                    {totalResults > 10 && (
                        <Box mt={4}>
                            <Button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                mr={2}
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={handleNextPage}
                                disabled={currentPage * 10 >= totalResults}
                            >
                                Next
                            </Button>
                            <Box as="span" ml={4}>
                                Page {currentPage} of {totalPages}
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default TripPlanner;
