import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  google_id: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  industry: string;
  owner_id: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  teams: Team[];
  currentTeam: Team | null;
  token: string | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
  setCurrentTeam: (team: Team) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem('rhythm90_token');
    const savedUser = localStorage.getItem('rhythm90_user');
    const savedTeams = localStorage.getItem('rhythm90_teams');
    const savedCurrentTeam = localStorage.getItem('rhythm90_current_team');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      apiClient.setToken(savedToken);

      if (savedTeams) {
        const parsedTeams = JSON.parse(savedTeams);
        setTeams(parsedTeams);
        
        if (savedCurrentTeam) {
          setCurrentTeam(JSON.parse(savedCurrentTeam));
        } else if (parsedTeams.length > 0) {
          setCurrentTeam(parsedTeams[0]);
        }
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (code: string) => {
    try {
      const redirectUri = window.location.origin + '/login';
      const response = await apiClient.googleAuth(code, redirectUri);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const { user, teams, access_token } = response.data;
        
        setUser(user);
        setTeams(teams);
        setToken(access_token);
        apiClient.setToken(access_token);

        // Set first team as current if available
        if (teams.length > 0) {
          setCurrentTeam(teams[0]);
        }

        // Save to localStorage
        localStorage.setItem('rhythm90_token', access_token);
        localStorage.setItem('rhythm90_user', JSON.stringify(user));
        localStorage.setItem('rhythm90_teams', JSON.stringify(teams));
        if (teams.length > 0) {
          localStorage.setItem('rhythm90_current_team', JSON.stringify(teams[0]));
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setTeams([]);
    setCurrentTeam(null);
    setToken(null);
    apiClient.clearToken();

    // Clear localStorage
    localStorage.removeItem('rhythm90_token');
    localStorage.removeItem('rhythm90_user');
    localStorage.removeItem('rhythm90_teams');
    localStorage.removeItem('rhythm90_current_team');
  };

  const handleSetCurrentTeam = (team: Team) => {
    setCurrentTeam(team);
    localStorage.setItem('rhythm90_current_team', JSON.stringify(team));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        teams,
        currentTeam,
        token,
        login,
        logout,
        setCurrentTeam: handleSetCurrentTeam,
        isLoading,
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