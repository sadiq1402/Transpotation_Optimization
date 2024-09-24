import 'leaflet/dist/leaflet.css';

import React, { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Icon, Grid, GridItem, Button, Select, Input, VStack } from '@chakra-ui/react';
import { FaTachometerAlt, FaGasPump, FaLeaf, FaClock, FaSmile } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for Leaflet's default icon not showing up
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState('New York');
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    fuelConsumption: '15,234 L',
    carbonEmissions: '2,456 kg',
    onTimePerformance: '98.5%',
    userSatisfaction: '4.8/5',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedCity === 'New York') {
      setDashboardData({
        fuelConsumption: '15234 L',
        carbonEmissions: '2456 kg',
        onTimePerformance: '98.5%',
        userSatisfaction: '4.8/5',
      });
    } else if (selectedCity === 'Kanpur') {
      setDashboardData({
        fuelConsumption: '12000 L',
        carbonEmissions: '1800 kg',
        onTimePerformance: '92.3%',
        userSatisfaction: '4.5/5',
      });
    }
  }, [selectedCity]);

  const formattedDate = currentTime.toLocaleDateString();
  const formattedTime = currentTime.toLocaleTimeString();

  // Export Dashboard Data as CSV
  const exportDashboard = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Fuel Consumption', dashboardData.fuelConsumption],
      ['Carbon Emissions', dashboardData.carbonEmissions],
      ['On-Time Performance', dashboardData.onTimePerformance],
      ['User Satisfaction', dashboardData.userSatisfaction],
      ['Date', formattedDate],
      ['Time', formattedTime],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,'
      + csvData.map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'dashboard_data.csv');
    document.body.appendChild(link);
    link.click();
  };

  // Coordinates for New York and Kanpur
  const cityCoordinates = {
    'New York': [40.7128, -74.0060],
    'Kanpur': [26.4499, 80.3319],
  };

  // Handle changes in start and end point
  const handleStartPointChange = (e) => setStartPoint(e.target.value);
  const handleEndPointChange = (e) => setEndPoint(e.target.value);

  return (
    <Flex>
      {/* Sidebar */}
      <Box w="16%" bg="gray.900" color="white" h="100vh" p={4}>
        <Heading size="md" mb={4}>Dashboard</Heading>
        <VStack align="start" spacing={4}>
          <Flex align="center">
            <Icon as={FaTachometerAlt} mr={2} />
            <Text>Dashboard</Text>
          </Flex>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box w="84%" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Transit Management System</Heading>
          <Flex align="center" gap={4}>
            <VStack spacing={0} align="end" mr={4}>
              <Text fontSize="sm">{formattedDate}</Text>
              <Text fontSize="sm">{formattedTime}</Text>
            </VStack>
            <Select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              w="120px"
              mr={4}
            >
              <option value="New York">New York</option>
              <option value="Kanpur">Kanpur</option>
            </Select>
            <Input placeholder="Search..." w="200px" mr={4} />
          </Flex>
        </Flex>

        {/* Dashboard Widgets */}
        <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
          <GridItem bg="blue.500" color="white" p={4} rounded="md">
            <Flex justify="space-between" align="center">
              <Text>Fuel Consumption</Text>
              <Icon as={FaGasPump} />
            </Flex>
            <Heading size="lg">{dashboardData.fuelConsumption}</Heading>
          </GridItem>
          <GridItem bg="green.500" color="white" p={4} rounded="md">
            <Flex justify="space-between" align="center">
              <Text>Carbon Emissions</Text>
              <Icon as={FaLeaf} />
            </Flex>
            <Heading size="lg">{dashboardData.carbonEmissions}</Heading>
          </GridItem>
          <GridItem bg="orange.500" color="white" p={4} rounded="md">
            <Flex justify="space-between" align="center">
              <Text>On-Time Performance</Text>
              <Icon as={FaClock} />
            </Flex>
            <Heading size="lg">{dashboardData.onTimePerformance}</Heading>
          </GridItem>
          <GridItem bg="purple.500" color="white" p={4} rounded="md">
            <Flex justify="space-between" align="center">
              <Text>User Satisfaction</Text>
              <Icon as={FaSmile} />
            </Flex>
            <Heading size="lg">{dashboardData.userSatisfaction}</Heading>
          </GridItem>
        </Grid>

        {/* Charts */}
        <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={6}>
          <GridItem bg="white" p={4} rounded="md" shadow="md">
            <Heading size="md" mb={4}>Fuel Consumption Trend</Heading>
            <img
              src="https://placehold.co/400x200?text=Fuel+Consumption+Trend+Graph"
              alt="Fuel Consumption Trend Graph"
            />
          </GridItem>
          <GridItem bg="white" p={4} rounded="md" shadow="md">
            <Heading size="md" mb={4}>Carbon Emissions by Day</Heading>
            <img
              src="https://placehold.co/400x200?text=Carbon+Emissions+by+Day+Graph"
              alt="Carbon Emissions by Day Graph"
            />
          </GridItem>
        </Grid>

        {/* Map Section */}
        <Box mb={6}>
          <Heading size="md" mb={4}>Map - Select Start and End Points</Heading>

          <Flex align="center" mb={4}>
            <Select placeholder="Select Start Point" onChange={handleStartPointChange} w="200px" mr={4}>
              <option value="New York">New York</option>
              <option value="Kanpur">Kanpur</option>
            </Select>
            <Select placeholder="Select Destination" onChange={handleEndPointChange} w="200px" mr={4}>
              <option value="New York">New York</option>
              <option value="Kanpur">Kanpur</option>
            </Select>
          </Flex>

          <MapContainer center={cityCoordinates[selectedCity]} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {startPoint && (
              <Marker position={cityCoordinates[startPoint]}>
                <Popup>{`Start Point: ${startPoint}`}</Popup>
              </Marker>
            )}
            {endPoint && (
              <Marker position={cityCoordinates[endPoint]}>
                <Popup>{`End Point: ${endPoint}`}</Popup>
              </Marker>
            )}
          </MapContainer>
        </Box>

        {/* Export Button */}
        <Flex justify="space-between" align="center">
          <Text>Version 1.0.0 | Last updated: {formattedDate}</Text>
          <Button colorScheme="blue" onClick={exportDashboard}>Export Dashboard</Button>
        </Flex>
      </Box>
    </Flex>
  );
}

export default App;
