import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const initialThemeContext: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {}
};

const ThemeContext = createContext<ThemeContextType>(initialThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Inicializar com o tema salvo ou a preferência do sistema
  useEffect(() => {
    // Verificar se tem preferência salva
    const savedTheme = localStorage.getItem('theme') as ThemeType | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Se não tiver preferência salva, usar a preferência do sistema
      setTheme('dark');
    }
  }, []);

  // Aplicar classe dark ao HTML quando o tema mudar
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Adicionar classe de transição global ao iniciar
    if (!root.classList.contains('transition-colors')) {
      root.classList.add('transition-colors');
      root.classList.add('duration-300');
    }
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Salvar preferência
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Função para alternar o tema com transição suave
  const toggleTheme = () => {
    setIsTransitioning(true);
    
    // Aplicar transição
    const root = window.document.documentElement;
    if (!root.classList.contains('transition-colors')) {
      root.classList.add('transition-colors');
      root.classList.add('duration-300');
    }
    
    // Alternar tema
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    
    // Remover classes de transição após um tempo
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para usar o tema
export function useTheme() {
  return useContext(ThemeContext);
} 