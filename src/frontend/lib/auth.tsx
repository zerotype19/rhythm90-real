import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  google_id: string;
  is_admin: boolean;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  industry: string;
  focus_areas: string; // JSON string array
  team_description: string;
  owner_id: string;
  invite_code: string | null;
  created_at: string;
}

interface SessionResponse {
  user: User;
  teams: Team[];
}

interface AuthContextType {
  user: User | null;
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  setCurrentTeam: (team: Team) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSession();
      if (response.data) {
        const sessionData = response.data as SessionResponse;
        setUser(sessionData.user);
        setTeams(sessionData.teams);
        setCurrentTeam(sessionData.teams && sessionData.teams.length > 0 ? sessionData.teams[0] : null);
      } else {
        setUser(null);
        setTeams([]);
        setCurrentTeam(null);
      }
    } catch (error) {
      setUser(null);
      setTeams([]);
      setCurrentTeam(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
    setTeams([]);
    setCurrentTeam(null);
  };

  const handleSetCurrentTeam = (team: Team) => {
    setCurrentTeam(team);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        teams,
        currentTeam,
        isLoading,
        refreshSession,
        logout,
        setCurrentTeam: handleSetCurrentTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 