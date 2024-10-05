import React, { useState, useEffect } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import {
    Box,
    Flex,
    Heading,
    Text,
    Icon,
    Grid,
    GridItem,
    Button,
    VStack,
} from "@chakra-ui/react";
import { FaTachometerAlt } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix for Leaflet's default icon not showing up
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function App() {
    // Dashboard states
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedCity, setSelectedCity] = useState("New York");
    const [dashboardData, setDashboardData] = useState({
        fuelConsumption: "15,234 L",
        carbonEmissions: "2,456 kg",
        onTimePerformance: "98.5%",
        userSatisfaction: "4.8/5",
    });

    const [activeView, setActiveView] = useState("overview");

    // Coordinates for New York and Kanpur
    const cityCoordinates = {
        "New York": [40.7128, -74.006],
    };

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Flex>
            {/* Sidebar */}
            <Box w="16%" bg="gray.900" color="white" h="auto" p={4}>
                <Heading size="md" mb={4}>
                    Dashboard
                </Heading>
                <VStack align="start" spacing={4}>
                    <Flex align="center">
                        <Icon as={FaTachometerAlt} mr={2} />
                        <Text>Overview</Text>
                    </Flex>

                    {/* Fetch Options Buttons */}
                    <Button
                        onClick={() => setActiveView("overview")}
                        colorScheme="teal"
                        size="sm"
                        mt={2}
                    >
                        Fetch Delay Distribution
                    </Button>
                </VStack>
            </Box>

            {/* Main Content */}
            <Box w="84%" p={6}>
                {activeView === "overview" && (
                    <>
                        <Flex justify="space-between" align="center" mb={6}>
                            <Heading size="lg">
                                Transit Management System
                            </Heading>
                            <Flex align="center" gap={4}>
                                <VStack spacing={0}>
                                    <Text fontSize="sm">Current Time:</Text>
                                    <Text fontSize="xl" fontWeight="bold">
                                        {currentTime.toLocaleTimeString()}
                                    </Text>
                                </VStack>
                            </Flex>
                        </Flex>

                        {/* Map Container */}
                        <MapContainer
                            center={cityCoordinates[selectedCity]}
                            zoom={13}
                            style={{ height: "400px", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={cityCoordinates[selectedCity]}>
                                <Popup>{selectedCity} is here!</Popup>
                            </Marker>
                        </MapContainer>

                        {/* Dashboard Metrics */}
                        <Grid templateColumns="repeat(4, 1fr)" gap={6} mt={6}>
                            <GridItem bg="blue.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    Fuel Consumption
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.fuelConsumption}
                                </Text>
                            </GridItem>
                            <GridItem bg="green.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    Carbon Emissions
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.carbonEmissions}
                                </Text>
                            </GridItem>
                            <GridItem bg="orange.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    On-Time Performance
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.onTimePerformance}
                                </Text>
                            </GridItem>
                            <GridItem bg="purple.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    User Satisfaction
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.userSatisfaction}
                                </Text>
                            </GridItem>
                        </Grid>
                    </>
                )}
            </Box>           
        </Flex>
    );
}

export default App;
