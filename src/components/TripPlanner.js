import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

const STOPS_PER_PAGE = 20;

// Helper function to safely format numbers
const safeNumberFormat = (number, decimals = 2) => {
    if (number === null || number === undefined || isNaN(number)) {
        return "N/A";
    }
    return Number(number).toFixed(decimals);
};

const PaginatedDropdown = ({ options, value, onChange, placeholder }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = Math.ceil((options?.length || 0) / STOPS_PER_PAGE);

    const getCurrentPageOptions = () => {
        if (!Array.isArray(options)) return [];
        const start = currentPage * STOPS_PER_PAGE;
        return options.slice(start, start + STOPS_PER_PAGE);
    };

    return (
        <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                {value || placeholder}
            </MenuButton>
            <MenuList maxHeight="300px" overflow="auto">
                {getCurrentPageOptions().map((option, index) => (
                    <MenuItem key={index} onClick={() => onChange(option)}>
                        {option}
                    </MenuItem>
                ))}
                {options?.length > 0 && (
                    <>
                        <MenuDivider />
                        <Box p={2}>
                            <HStack justify="space-between">
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(0, prev - 1)
                                        )
                                    }
                                    isDisabled={currentPage === 0}
                                >
                                    Previous
                                </Button>
                                <Text>
                                    Page {currentPage + 1} of {totalPages}
                                </Text>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(totalPages - 1, prev + 1)
                                        )
                                    }
                                    isDisabled={currentPage === totalPages - 1}
                                >
                                    Next
                                </Button>
                            </HStack>
                        </Box>
                    </>
                )}
            </MenuList>
        </Menu>
    );
};

const TripPlanner = () => {
    const [startStop, setStartStop] = useState("");
    const [endStop, setEndStop] = useState("");
    const [stops, setStops] = useState([]);
    const [availableTrips, setAvailableTrips] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [tripDetails, setTripDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingStops, setFetchingStops] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchStops();
    }, []);

    const fetchStops = async () => {
        setFetchingStops(true);
        try {
            const response = await fetch("http://localhost:5000/stops");
            const data = await response.json();
            if (Array.isArray(data)) {
                const stopNames = data
                    .filter((stop) => stop && stop.stop_name)
                    .map((stop) => stop.stop_name);
                setStops(stopNames);
            } else {
                throw new Error("Invalid stops data received");
            }
        } catch (error) {
            toast({
                title: "Error fetching stops",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setFetchingStops(false);
        }
    };

    const handleSearch = async () => {
        if (!startStop || !endStop) {
            toast({
                title: "Error",
                description: "Please select both start and end stops",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:5000/api/trips_between_stops?start_stop_name=${encodeURIComponent(
                    startStop
                )}&end_stop_name=${encodeURIComponent(endStop)}`
            );
            const data = await response.json();

            if (response.ok && data.trips_between_stops) {
                setAvailableTrips(data.trips_between_stops);
            } else {
                throw new Error(data.error || "Failed to find trips");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTripSelect = async (tripId) => {
        setSelectedTrip(tripId);
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:5000/api/routes_between_stops?trip_id=${tripId}`
            );
            const data = await response.json();

            if (response.ok) {
                setTripDetails(data);
            } else {
                throw new Error(data.error || "Failed to get trip details");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            setSelectedTrip(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={5}>
            <VStack spacing={4} align="stretch">
                <Text fontSize="2xl" fontWeight="bold">
                    Trip Planner
                </Text>

                <HStack spacing={4}>
                    <PaginatedDropdown
                        options={stops}
                        value={startStop}
                        onChange={setStartStop}
                        placeholder={
                            fetchingStops
                                ? "Loading stops..."
                                : "Select start stop"
                        }
                    />

                    <PaginatedDropdown
                        options={stops}
                        value={endStop}
                        onChange={setEndStop}
                        placeholder={
                            fetchingStops
                                ? "Loading stops..."
                                : "Select end stop"
                        }
                    />

                    <Button
                        colorScheme="blue"
                        onClick={handleSearch}
                        isLoading={loading}
                        isDisabled={!startStop || !endStop || fetchingStops}
                    >
                        Search
                    </Button>
                </HStack>

                {availableTrips && availableTrips.length > 0 && (
                    <Box>
                        <Text fontSize="xl" fontWeight="semibold">
                            Available Trips
                        </Text>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Route</Th>
                                    <Th>Duration</Th>
                                    <Th>Distance</Th>
                                    <Th>Action</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {availableTrips.map((trip) => (
                                    <Tr key={trip.trip_id}>
                                        <Td>{trip.route_long_name || "N/A"}</Td>
                                        <Td>
                                            {safeNumberFormat(trip.duration)}{" "}
                                            mins
                                        </Td>
                                        <Td>
                                            {safeNumberFormat(trip.distance)} km
                                        </Td>
                                        <Td>
                                            <Button
                                                size="sm"
                                                colorScheme="blue"
                                                onClick={() =>
                                                    handleTripSelect(
                                                        trip.trip_id
                                                    )
                                                }
                                                isLoading={
                                                    loading &&
                                                    selectedTrip ===
                                                        trip.trip_id
                                                }
                                            >
                                                Select
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                )}

                {tripDetails && (
                    <Box>
                        <Text fontSize="xl" fontWeight="semibold">
                            Trip Details
                        </Text>
                        <VStack align="stretch" spacing={3}>
                            <Text>
                                Total Distance:{" "}
                                {safeNumberFormat(tripDetails.total_distance)}{" "}
                                km
                            </Text>
                            <Text>
                                Expected Duration:{" "}
                                {safeNumberFormat(
                                    tripDetails.expected_duration
                                )}{" "}
                                minutes
                            </Text>
                            <Text>
                                Average Speed:{" "}
                                {safeNumberFormat(
                                    tripDetails.expected_speed_kmph
                                )}{" "}
                                km/h
                            </Text>

                            {tripDetails.in_between_stops &&
                                tripDetails.in_between_stops.length > 0 && (
                                    <>
                                        <Text fontWeight="semibold">
                                            Stops:
                                        </Text>
                                        <Table variant="simple" size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Stop Name</Th>
                                                    <Th>Arrival Time</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {tripDetails.in_between_stops.map(
                                                    (stop, index) => (
                                                        <Tr
                                                            key={
                                                                stop.stop_id ||
                                                                index
                                                            }
                                                        >
                                                            <Td>
                                                                {stop.stop_name ||
                                                                    "N/A"}
                                                            </Td>
                                                            <Td>
                                                                {stop.arrival_time ||
                                                                    "N/A"}
                                                            </Td>
                                                        </Tr>
                                                    )
                                                )}
                                            </Tbody>
                                        </Table>
                                    </>
                                )}
                        </VStack>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default TripPlanner;
