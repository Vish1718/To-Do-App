import React, { useState } from "react";
import OnboardingScreen from "./page/OnboardingScreen";
import DashboardScreen from "./page/DashboardScreen";

export default function App() {
  const [isDashboard, setIsDashboard] = useState(false);
  return isDashboard ? <DashboardScreen /> : <OnboardingScreen setIsDashboard={setIsDashboard} />;
}
