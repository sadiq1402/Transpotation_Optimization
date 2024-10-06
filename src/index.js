import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import FrequentRoutesModal from "./components/FrequentRoutesModal";

import PeakHourTraffic from "./components/PeakHourTraffic";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <ChakraProvider>
        <App />
    </ChakraProvider>
);
