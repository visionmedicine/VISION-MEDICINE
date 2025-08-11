import { ChakraProvider } from "@chakra-ui/react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.tsx";
import { Suspense } from "react";

function App() {
  return (
    <ChakraProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </ChakraProvider>
  );
}

export default App;
