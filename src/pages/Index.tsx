import "@fontsource/orbitron/400.css";
import "@fontsource/orbitron/700.css";
import "@fontsource/orbitron/900.css";
import { SnakeGame } from "@/components/SnakeGame";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-orbitron">
      <SnakeGame />
    </div>
  );
};

export default Index;
