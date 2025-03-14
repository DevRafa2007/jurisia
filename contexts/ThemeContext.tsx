import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

// Interface para o contexto
interface ThemeContextType {
  theme: string;
  resolvedTheme?: string;
  toggleTheme: () => void;
}

// Valor padrão para o contexto
const defaultContext: ThemeContextType = {
  theme: 'light',
  resolvedTheme: 'light',
  toggleTheme: () => {},
};

// Criar o contexto
const ThemeContext = createContext<ThemeContextType>(defaultContext);

// Prop types para o provedor
interface ThemeProviderProps {
  children: ReactNode;
}

// Componente provedor que usa o next-themes sob o capô
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Efeito para garantir renderização apenas no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Função para alternar entre temas
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Valor do contexto
  const value = {
    theme: theme || 'light',
    resolvedTheme: mounted ? resolvedTheme : 'light',
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useTheme = () => useContext(ThemeContext); 