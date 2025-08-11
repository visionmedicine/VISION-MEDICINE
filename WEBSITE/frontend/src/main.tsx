import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index";

// Buat sistem Chakra
const system = createSystem(defaultConfig);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
);
