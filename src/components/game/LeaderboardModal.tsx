import { useState, useEffect } from "react";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal = ({ isOpen, onClose }: LeaderboardModalProps) => {
  const [scores, setScores] = useState<Array<{ username: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leaderboard")
      .select("username, score")
      .order("score", { ascending: false })
      .limit(10);
    if (data) {
      setScores(data);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border-2 border-primary shadow-neon-green rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            LEADERBOARD
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-primary/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No scores yet!</div>
        ) : (
          <div className="space-y-2">
            {scores.map((entry, index) => (
              <div
                key={index}
                className={`flex justify-between items-center py-3 px-4 rounded-lg ${
                  index === 0
                    ? "bg-primary/20 border border-primary"
                    : index === 1
                    ? "bg-secondary/20 border border-secondary"
                    : index === 2
                    ? "bg-accent/20 border border-accent"
                    : "bg-card/50 border border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-black ${
                      index === 0
                        ? "text-primary"
                        : index === 1
                        ? "text-secondary"
                        : index === 2
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span className="text-foreground font-medium">{entry.username}</span>
                </div>
                <span className="text-xl font-black text-primary">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
