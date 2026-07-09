import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { router } from "./routes/router";
import { initWebApp } from "./telegram/webApp";

export default function App() {
  useEffect(() => {
    initWebApp();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
