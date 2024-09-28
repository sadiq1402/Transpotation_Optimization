import React, { useState, useEffect,useRef } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Box, Flex, Heading, Text, Icon, Grid, GridItem, Button, VStack, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { FaTachometerAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Home from './Home';

// Fix for Leaflet's default icon not showing up
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function App() {
  // Dashboard states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState('New York');
  const [dashboardData, setDashboardData] = useState({
    fuelConsumption: '15,234 L',
    carbonEmissions: '2,456 kg',
    onTimePerformance: '98.5%',
    userSatisfaction: '4.8/5',
  });

  // API-related states
  const [routeAnalysisData, setRouteAnalysisData] = useState([]);
  const [showSpline, setShowSpline] = useState(false); // State to manage Spline scene
  const [imageUrl, setImageUrl] = useState('');
  const [heatMapUrl, setHeatMapUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const splineRef = useRef(null); // Create a ref for the animation section

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const routesPerPage = 10;
  const indexOfLastRoute = currentPage * routesPerPage;
  const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
  const currentRoutes = routeAnalysisData.slice(indexOfFirstRoute, indexOfLastRoute);
  const totalPages = Math.ceil(routeAnalysisData.length / routesPerPage);

  // Coordinates for New York and Kanpur
  const cityCoordinates = {
    'New York': [40.7128, -74.0060],
    'Kanpur': [26.4499, 80.3319],
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update dashboard data based on selected city
  useEffect(() => {
    if (selectedCity === 'New York') {
      setDashboardData({
        fuelConsumption: '15234 L',
        carbonEmissions: '2500 kg',
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

  // Fetch route analysis data from Flask API
  useEffect(() => {
    const fetchRouteAnalysis = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/route-analysis');
        setRouteAnalysisData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching route analysis data', error);
        setLoading(false);
      }
    };
    fetchRouteAnalysis();
  }, []);

  // Fetch delay distribution image from Flask
  const handleFetchDelayDistribution = async () => {
    setShowSpline(true); // Show Spline scene
  
    if (splineRef.current) {
      splineRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  
    try {
      const response = await axios.get('http://127.0.0.1:5000/delay-distribution');
      setImageUrl(response.data.path); // Set the fetched image URL
    } catch (error) {
      console.error('Error fetching delay distribution image', error);
    }
  
    // Hide Spline scene after a delay (optional)
    setTimeout(() => {
      setShowSpline(false); // Hide Spline scene
    }, 5000);
  };
  

  // Fetch delayed origins heatmap from Flask
  useEffect(() => {
    const fetchHeatMap = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/delayed-origins-heatmap');
        setHeatMapUrl(response.data.path);
      } catch (error) {
        console.error('Error fetching heatmap', error);
      }
    };
    fetchHeatMap();
  }, []);

  // Export Dashboard Data as CSV
  const exportDashboard = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Fuel Consumption', dashboardData.fuelConsumption],
      ['Carbon Emissions', dashboardData.carbonEmissions],
      ['On-Time Performance', dashboardData.onTimePerformance],
      ['User Satisfaction', dashboardData.userSatisfaction],
      ['Date', currentTime.toLocaleDateString()],
      ['Time', currentTime.toLocaleTimeString()],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvData.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'dashboard_data.csv');
    document.body.appendChild(link);
    link.click();
  };

  // Pagination controls
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Flex>
      {/* Sidebar */}
      <Box w="16%" bg="gray.900" color="white" h="auto" p={4}>
        <Heading size="md" mb={4}>Dashboard</Heading>
        <VStack align="start" spacing={4}>
          <Flex align="center">
            <Icon as={FaTachometerAlt} mr={2} />
            <Text>Overview</Text>
          </Flex>

          {/* Fetch Options Buttons */}
          <Button onClick={handleFetchDelayDistribution} colorScheme="teal" size="sm" mt={2}>
            Fetch Delay Distribution
          </Button>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box w="84%" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Transit Management System</Heading>
          <Flex align="center" gap={4}>
            <VStack spacing={0}>
              <Text fontSize="sm">Current Time:</Text>
              <Text fontSize="xl" fontWeight="bold">{currentTime.toLocaleTimeString()}</Text>
            </VStack>
            <Button onClick={exportDashboard} colorScheme="blue">
              Export Dashboard
            </Button>
          </Flex>
        </Flex>

        {/* Map Container */}
        <MapContainer center={cityCoordinates[selectedCity]} zoom={13} style={{ height: '400px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={cityCoordinates[selectedCity]}>
            <Popup>
              {selectedCity} is here!
            </Popup>
          </Marker>
        </MapContainer>

        {/* Dashboard Metrics */}
        <Grid templateColumns="repeat(4, 1fr)" gap={6} mt={6}>
          <GridItem bg="blue.500" p={4} borderRadius="md">
            <Text fontSize="lg" fontWeight="bold">Fuel Consumption</Text>
            <Text fontSize="2xl">{dashboardData.fuelConsumption}</Text>
          </GridItem>
          <GridItem bg="green.500" p={4} borderRadius="md">
            <Text fontSize="lg" fontWeight="bold">Carbon Emissions</Text>
            <Text fontSize="2xl">{dashboardData.carbonEmissions}</Text>
          </GridItem>
          <GridItem bg="orange.500" p={4} borderRadius="md">
            <Text fontSize="lg" fontWeight="bold">On-Time Performance</Text>
            <Text fontSize="2xl">{dashboardData.onTimePerformance}</Text>
          </GridItem>
          <GridItem bg="purple.500" p={4} borderRadius="md">
            <Text fontSize="lg" fontWeight="bold">User Satisfaction</Text>
            <Text fontSize="2xl">{dashboardData.userSatisfaction}</Text>
          </GridItem>
        </Grid>

        {/* Route Analysis Table */}
        <Heading size="md" mt={6}>Route Analysis</Heading>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <Table variant="striped" colorScheme="gray" mt={4}>
            <Thead>
              <Tr>
                <Th>Route</Th>
                <Th>Delay (min)</Th>
                <Th>Distance (km)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentRoutes.map((route, index) => (
                <Tr key={index}>
                  <Td>{route.PublishedLineName}</Td>
                  <Td>{(route.AvgDelays).toFixed(2)}</Td>
                  <Td>{route.TotalTrips}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {/* Pagination Controls */}
        <Flex justify="space-between" align="center" mt={4}>
          <Button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</Button>
          <Text>Page {currentPage} of {totalPages}</Text>
          <Button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
        </Flex>

        {/* Delay Distribution Image */}
        {showSpline ? (
          <Box ref={splineRef} mt={8}>
            <Home /> {/* Spline scene here */}
          </Box>
        ) : imageUrl ? (
          <Box mt={8}>
            <Heading size="md">Delay Distribution Image</Heading>
            <img src={`http://127.0.0.1:5000/${imageUrl}`} alt="Delay Distribution" style={{ maxWidth: '100%' }} />
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
}

export default App;
