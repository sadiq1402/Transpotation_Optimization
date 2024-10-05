// import React, { useState } from "react";
// import { Box, VStack, Input, Button, Select } from "@chakra-ui/react";
// import {
//     MapContainer,
//     TileLayer,
//     Marker,
//     Popup,
//     Polyline,
// } from "react-leaflet";

// const OptimizationRoute = () => {
//     const [startPoint, setStartPoint] = useState("");
//     const [endPoint, setEndPoint] = useState("");
//     const [via, setVia] = useState("");
//     const [showMap, setShowMap] = useState(false);

//     // Mock data for autocomplete and via options
//     const locations = [
//         "New York",
//         "Los Angeles",
//         "Chicago",
//         "Houston",
//         "Phoenix",
//     ];
//     const viaOptions = ["Route A", "Route B", "Route C"];

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         setShowMap(true);
//     };

//     return (
//         <Box mt={4} h="100vh">
//             <form onSubmit={handleSubmit}>
//                 <VStack spacing={4} align="stretch">
//                     <Input
//                         placeholder="Start Point"
//                         value={startPoint}
//                         onChange={(e) => setStartPoint(e.target.value)}
//                         list="locations"
//                     />
//                     <Input
//                         placeholder="End Point"
//                         value={endPoint}
//                         onChange={(e) => setEndPoint(e.target.value)}
//                         list="locations"
//                     />
//                     <Select
//                         placeholder="Select via (optional)"
//                         onChange={(e) => setVia(e.target.value)}
//                     >
//                         {viaOptions.map((option) => (
//                             <option key={option} value={option}>
//                                 {option}
//                             </option>
//                         ))}
//                     </Select>
//                     <Button type="submit" colorScheme="blue">
//                         Show Route
//                     </Button>
//                 </VStack>
//             </form>

//             <datalist id="locations">
//                 {locations.map((location) => (
//                     <option key={location} value={location} />
//                 ))}
//             </datalist>

//             {showMap && (
//                 <Box mt={4} h="60vh">
//                     <MapContainer
//                         center={[40.7128, -74.006]}
//                         zoom={13}
//                         style={{ height: "100%", width: "100%" }}
//                     >
//                         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                         <Marker position={[40.7128, -74.006]}>
//                             <Popup>Start: {startPoint}</Popup>
//                         </Marker>
//                         <Marker position={[34.0522, -118.2437]}>
//                             <Popup>End: {endPoint}</Popup>
//                         </Marker>
//                         <Polyline
//                             positions={[
//                                 [40.7128, -74.006],
//                                 [34.0522, -118.2437],
//                             ]}
//                             color="blue"
//                         />
//                     </MapContainer>
//                 </Box>
//             )}
//         </Box>
//     );
// };

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Select,
    VStack,
    HStack,
    IconButton,
    Text,
} from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Dummy data for via points
const viaOptions = [
    { value: "via1", label: "Central Park", coordinates: [40.7812, -73.9665] },
    { value: "via2", label: "Times Square", coordinates: [40.758, -73.9855] },
    {
        value: "via3",
        label: "Brooklyn Bridge",
        coordinates: [40.7061, -73.9969],
    },
];

// Dummy data for start and end points
const dummyPoints = {
    start: { label: "Empire State Building", coordinates: [40.7484, -73.9857] },
    end: { label: "Statue of Liberty", coordinates: [40.6892, -74.0445] },
};

const OptimizationRoute = ({ onClose }) => {
    const [startPoint, setStartPoint] = useState(dummyPoints.start.label);
    const [endPoint, setEndPoint] = useState(dummyPoints.end.label);
    const [selectedVia, setSelectedVia] = useState("");
    const [showMap, setShowMap] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const handleOptimize = () => {
        // Here you would typically call your backend API for route optimization
        // For now, we'll just show the map
        setShowMap(true);
    };
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Box mt={4} h="100vh">
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Route Optimization</Heading>
                {/* <IconButton
                    icon={<FaTimes />}
                    onClick={onClose}
                    aria-label="Close"
                /> */}
                <Flex align="center" gap={4}>
                    <VStack spacing={0}>
                        <Text fontSize="sm">Current Time:</Text>
                        <Text fontSize="xl" fontWeight="bold">
                            {currentTime.toLocaleTimeString()}
                        </Text>
                    </VStack>
                </Flex>
            </Flex>

            <VStack spacing={4} align="stretch">
                <Input
                    placeholder="Start Point"
                    value={startPoint}
                    onChange={(e) => setStartPoint(e.target.value)}
                />
                <Input
                    placeholder="End Point"
                    value={endPoint}
                    onChange={(e) => setEndPoint(e.target.value)}
                />
                <Select
                    placeholder="Select Via Point (Optional)"
                    value={selectedVia}
                    onChange={(e) => setSelectedVia(e.target.value)}
                >
                    {viaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
                <Button colorScheme="blue" onClick={handleOptimize}>
                    Optimize Route
                </Button>
            </VStack>

            {showMap && (
                <Box mt={6} h="400px">
                    <MapContainer
                        center={[40.7128, -74.006]} // New York City coordinates
                        zoom={11}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={dummyPoints.start.coordinates}>
                            <Popup>{dummyPoints.start.label}</Popup>
                        </Marker>
                        <Marker position={dummyPoints.end.coordinates}>
                            <Popup>{dummyPoints.end.label}</Popup>
                        </Marker>
                        {selectedVia && (
                            <Marker
                                position={
                                    viaOptions.find(
                                        (v) => v.value === selectedVia
                                    ).coordinates
                                }
                            >
                                <Popup>
                                    {
                                        viaOptions.find(
                                            (v) => v.value === selectedVia
                                        ).label
                                    }
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </Box>
            )}
        </Box>
    );
};
export default OptimizationRoute;
