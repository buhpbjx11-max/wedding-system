import { useAuth } from "@/_core/hooks/useAuth";
import HebrewHome from "./HebrewHome";
import Dashboard from "./Dashboard";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <HebrewHome />;
}
